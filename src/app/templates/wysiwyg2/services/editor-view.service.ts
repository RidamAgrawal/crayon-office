import { Injectable, signal, WritableSignal } from '@angular/core';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import {
  Schema,
  DOMParser as ProseMirrorDOMParser,
  DOMSerializer,
  Node,
} from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { splitListItem } from 'prosemirror-schema-list';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

@Injectable({
  providedIn: 'any',
})
export class EditorViewService {
  public state: WritableSignal<EditorState> = signal<EditorState>(null!);
  public view: WritableSignal<EditorView> = signal<EditorView>(null!);
  public schema: WritableSignal<Schema> = signal<Schema>(null!);

  public createView(value: string, node: HTMLElement | null) {
    if (!node) {
      console.warn("editor element not passed");
      return;
    }
    const schema = this.createSchema();
    this.schema.set(schema);
    const state = this.createState(schema, value);
    this.state.set(state);
    this.view.set(
      new EditorView(node, {
        state: state,
        dispatchTransaction: (tr) => {
          const newState = this.view().state.apply(tr);
          this.view()?.updateState(newState);

          const html = DOMSerializer.fromSchema(schema).serializeFragment(
            newState.doc.content,
          );
          // console.log(html);
        },
        nodeViews: {
          task_item: (node, view, getPos) =>
            this.taskItemNodeView(node, view, getPos),
          code_block: (node, view, getPos) =>
            this.codeBlockNodeView(node, view, getPos),
        },
      }),
    );
  }

  private createSchema() {
    // Extend basic schema
    let nodes = schema.spec.nodes.addBefore('image', 'image', {
      inline: true,
      attrs: { src: {}, alt: { default: null } },
      group: 'inline',
      draggable: true,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: (d: any) => ({
            src: (d as HTMLElement).getAttribute('src'),
            alt: (d as HTMLElement).getAttribute('alt'),
          }),
        },
      ],
      toDOM: (node: any) => [
        'img',
        { src: node.attrs['src'], alt: node.attrs['alt'] || '' },
      ],
    });

    // Add ordered_list, bullet_list, list_item nodes (Jira/Atlassian-style HTML)
    nodes = nodes.append({
      ordered_list: {
        group: 'block',
        content: 'list_item+',
        attrs: { order: { default: 1 }, indentLevel: { default: 1 } },
        parseDOM: [
          {
            tag: 'ol',
            getAttrs: (el: any) => ({
              order: (el as HTMLElement).hasAttribute('start')
                ? +(el as HTMLElement).getAttribute('start')!
                : 1,
              indentLevel:
                +(el as HTMLElement).getAttribute('data-indent-level')! || 1,
            }),
          },
        ],
        toDOM: (node: any) =>
          [
            'ol',
            {
              start: node.attrs['order'],
              class: 'ak-ol',
              'data-prosemirror-content-type': 'node',
              'data-prosemirror-node-name': 'orderedList',
              'data-prosemirror-node-block': 'true',
              'data-indent-level': String(node.attrs['indentLevel']),
              style:
                'list-style-type: decimal;padding-left: 1.25rem;display: flow-root;box-sizing: border-box;',
            },
            0,
          ] as any,
      },
      bullet_list: {
        group: 'block',
        content: 'list_item+',
        attrs: { indentLevel: { default: 1 } },
        parseDOM: [
          {
            tag: 'ul',
            getAttrs: (el: any) => ({
              indentLevel:
                +(el as HTMLElement).getAttribute('data-indent-level')! || 1,
            }),
          },
        ],
        toDOM: (node: any) =>
          [
            'ul',
            {
              class: 'ak-ul',
              'data-prosemirror-content-type': 'node',
              'data-prosemirror-node-name': 'bulletList',
              'data-prosemirror-node-block': 'true',
              'data-indent-level': String(node.attrs['indentLevel']),
              style:
                'list-style-type: disc;padding-left: 1.25rem;display: flow-root;box-sizing: border-box;',
            },
            0,
          ] as any,
      },
      list_item: {
        content: 'paragraph block*',
        defining: true,
        parseDOM: [{ tag: 'li' }],
        toDOM: () =>
          [
            'li',
            {
              'data-prosemirror-content-type': 'node',
              'data-prosemirror-node-name': 'listItem',
              'data-prosemirror-node-block': 'true',
            },
            0,
          ] as any,
      },
    });

    // Add hard_break for Shift+Enter
    nodes = nodes.addBefore('image', 'hard_break', {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br'] as any,
    });

    // Add task_list and task_item nodes
    nodes = nodes.append({
      task_list: {
        group: 'block',
        content: 'task_item+',
        parseDOM: [{ tag: 'div[data-node-type="taskList"]' }],
        toDOM: () =>
          [
            'div',
            { 'data-node-type': 'taskList', class: 'task-list' },
            0,
          ] as any,
      },
      task_item: {
        content: 'paragraph block*',
        attrs: { checked: { default: false }, localId: { default: null } },
        defining: true,
        parseDOM: [
          {
            tag: 'div[data-task-state]',
            getAttrs: (el: HTMLElement) => ({
              checked: el.dataset['taskState'] === 'DONE',
              localId: el.dataset['localId'] || null,
            }),
          },
        ],
        toDOM: (node) => [
          'div',
          {
            'data-task-state': node.attrs['checked'] ? 'DONE' : 'TODO',
            class: `task-item ${node.attrs['checked'] ? 'task-item-checked' : ''}`,
          },
          0,
        ],
      },
    });

    nodes = nodes.append({
      code_block: {
        group: 'block',
        content: 'text*',
        code: true,
        defining: true,
        marks: '',
        attrs: { language: { default: null } },
        parseDOM: [
          {
            tag: 'div[data-prosemirror-node-name="codeBlock"]',
            getAttrs: (el: HTMLElement) => ({
              language: el.getAttribute('data-language') || null,
            }),
            preserveWhitespace: 'full',
          },
          {
            tag: 'pre',
            preserveWhitespace: 'full',
            getAttrs: () => ({ language: null }),
          },
        ],
        toDOM: (node) => [
          'div',
          {
            class: 'code-block',
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'codeBlock',
            'data-prosemirror-node-block': 'true',
            'data-language': node.attrs['language'] || '',
            contenteditable: 'false',
          },
          ['pre', ['code', 0]],
        ],
      },
    });

    const marks = schema.spec.marks.append({
      u: { parseDOM: [{ tag: 'u' }], toDOM: () => ['u', 0] as const },
      s: { parseDOM: [{ tag: 's' }], toDOM: () => ['s', 0] as const },
      sub: { parseDOM: [{ tag: 'sub' }], toDOM: () => ['sub', 0] as const },
      sup: { parseDOM: [{ tag: 'sup' }], toDOM: () => ['sup', 0] as const },
      o: {
        parseDOM: [
          {
            tag: 'span',
            getAttrs: (el: any) => {
              const style = (el as HTMLElement).style;
              return style.textDecoration?.includes('overline') ||
                style.textDecorationLine?.includes('overline')
                ? null
                : false;
            },
          },
        ],
        toDOM: () =>
          ['span', { style: 'text-decoration: overline' }, 0] as const,
      },
      us: {
        parseDOM: [
          {
            tag: 'span',
            getAttrs: (el: any) => {
              const style = (el as HTMLElement).style;
              return style.textDecorationStyle === 'wavy' ? null : false;
            },
          },
        ],
        toDOM: () =>
          [
            'span',
            {
              style: 'text-decoration: underline; text-decoration-style: wavy',
            },
            0,
          ] as const,
      },
      color: {
        attrs: { color: {} },
        inline: true,
        group: 'inline',
        parseDOM: [
          {
            tag: 'span[style*="color"]',
            getAttrs: (el: any) => ({ color: (el as HTMLElement).style.color }),
          },
        ],
        toDOM: (mark: any) => [
          'span',
          { style: `color: ${mark.attrs['color']}` },
        ],
      },
    });
    nodes = nodes.append({
      emoji: {
        parseDOM: [{ tag: 'span' }],
        toDOM: () => ['span', 0] as const,
      },
    });

    return new Schema({ nodes, marks });
  }

  private createState(schema: Schema, value: string) {
    return EditorState.create({
      schema,
      doc: value
        ? ProseMirrorDOMParser.fromSchema(schema).parse(
            new DOMParser().parseFromString(value, 'text/html').body,
          )
        : undefined,
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-b': toggleMark(schema.marks['strong']),
        }),
        // List keymap — must come before baseKeymap so Enter is handled in lists
        // Try task_item first, then list_item
        keymap({
          Enter: (state, dispatch, view) =>
            splitListItem(schema.nodes['task_item'])(state, dispatch) ||
            splitListItem(schema.nodes['list_item'])(state, dispatch),
          'Shift-Enter': (state: any, dispatch: any) => {
            const br = schema.nodes['hard_break'].create();
            dispatch?.(state.tr.replaceSelectionWith(br).scrollIntoView());
            return true;
          },
        }),
        keymap(baseKeymap),
        inputRules({ rules: [] }),
        dropCursor(),
        gapCursor(),
      ],
    });
  }

  private taskItemNodeView(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    // Outer container
    const outer = document.createElement('div');
    outer.classList.add('taskItemView-content-wrap');
    outer.style.cssText = `
            list-style: none;
            min-width: 48px;
            position: relative;
          `;
    outer.dataset['taskState'] = node.attrs['checked'] ? 'DONE' : 'TODO';
    outer.dataset['localId'] = node.attrs['localId'] || crypto.randomUUID();

    // main container
    const main = document.createElement('div');
    main.setAttribute('data-component', 'task-item-main');
    main.style.cssText = `
            display: flex;
            flex-direction: row;
            position: relative;
          `;
    outer.appendChild(main);

    // checkbox wrapper
    const checkboxWrap = document.createElement('span');
    checkboxWrap.contentEditable = 'false';
    checkboxWrap.className = 'task-item-checkbox-wrap';
    checkboxWrap.style.cssText = `
            position: relative;
            width: 24px;
            height: 1.714em;
            flex: 0 0 24px;
            align-self: start;
            cursor: pointer;
          `;
    main.appendChild(checkboxWrap);

    let isChecked = node.attrs['checked'];

    checkboxWrap.addEventListener('mousedown', (e) => {
      const pos = getPos();

      if (pos == null) return;
      isChecked = !isChecked;
      updateIcon(isChecked);

      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...view.state.doc.nodeAt(pos)?.attrs,
          checked: isChecked,
        }),
      );
    });

    const iconWrap = document.createElement('span');
    iconWrap.setAttribute('data-component', 'checkbox-icon-wrap');
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.style.cssText = `
            height: 24px;
            width: 24px;
            display: inline-block;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            overflow-wrap: break-word;
            white-space: pre-wrap;
            pointer-events: none;
          `;
    checkboxWrap.appendChild(iconWrap);

    // unchecked icon
    const uncheckedSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    uncheckedSvg.setAttribute('viewBox', '0 0 16 16');
    uncheckedSvg.setAttribute('width', '16');
    uncheckedSvg.setAttribute('height', '16');
    uncheckedSvg.setAttribute('fill', 'none');
    uncheckedSvg.dataset['component'] = 'checkbox-unchecked-icon';
    uncheckedSvg.innerHTML = `
  <rect width="12.5" height="12.5" x="1.75" y="1.75" rx="1.25" style="stroke: #8C8F97;stroke-width: 1;transition: stroke 0.2s ease-in-out;"></rect>
`;
    uncheckedSvg.style.cssText = `
            display: inline;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            transition: color 0.2s ease-in-out, fill 0.2s ease-in-out;
            width: 16px;
            height: 16px;
            pointer-events: none;
          `;

    // checked icon
    const checkedSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    checkedSvg.setAttribute('viewBox', '0 0 16 16');
    checkedSvg.setAttribute('width', '16');
    checkedSvg.setAttribute('height', '16');
    checkedSvg.dataset['component'] = 'checkbox-checked-icon';
    checkedSvg.innerHTML = `
  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
    d="M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm9.326 4.48-1.152-.96L6.75 9.828 4.826 7.52l-1.152.96 2.5 3a.75.75 0 0 0 1.152 0z"/>
`;
    checkedSvg.style.cssText = `
            display: inline;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #1868db;
            fill: #fff;
            transition: color 0.2s ease-in-out, fill 0.2s ease-in-out;
            width: 16px;
            height: 16px;
            pointer-events: none;
          `;
    iconWrap.appendChild(uncheckedSvg);
    iconWrap.appendChild(checkedSvg);

    const updateIcon = (checked: boolean) => {
      uncheckedSvg.style.display = checked ? 'none' : '';
      checkedSvg.style.display = checked ? '' : 'none';
    };
    updateIcon(node.attrs['checked']);

    // placeholder
    const placeholder = document.createElement('span');
    placeholder.style.cssText = `
            position: absolute;
            color: var(--ds-text-subtlest, #6B6E76);
            margin: 0 0 0 calc(var(--ds-space-100, 8px) * 3);
            pointer-events: none;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: calc(100% - 50px);
          `;
    placeholder.textContent =
      "Type your action, then '@' if you want to notify someone about it.";
    placeholder.contentEditable = 'false';
    placeholder.className = 'placeholder-node-view';
    main.appendChild(placeholder);

    // content container
    const contentWrap = document.createElement('div');
    contentWrap.setAttribute('data-component', 'content');
    contentWrap.style.cssText = `
            margin: 0px;
            overflow-wrap: break-word;
            min-width: 0px;
            flex: 1 1 auto;
            line-height: 1.714em;
          `;
    main.appendChild(contentWrap);

    const contentDOM = document.createElement('div');
    contentDOM.className = 'task-item';
    contentWrap.appendChild(contentDOM);

    // Initial placeholder state
    const updatePlaceholder = (currentNode: any) => {
      const isEmpty = currentNode.textContent.trim().length === 0;
      placeholder.style.display = isEmpty ? '' : 'none';
    };

    updatePlaceholder(node);

    return {
      dom: outer,
      contentDOM,
      update(updatedNode: Node) {
        if (updatedNode.type !== node.type) return false;

        updatePlaceholder(updatedNode);

        // update checkbox if needed
        const newChecked = updatedNode.attrs['checked'];
        if (newChecked !== isChecked) {
          isChecked = newChecked;
          updateIcon(newChecked);
        }

        return true;
      },
    };
  }

  private codeBlockNodeView(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    let currentCode = node.textContent;

    // ── Outer wrapper ──────────────────────────────────────────
    const outer = document.createElement('div');
    outer.className = 'cm-editor code-block';
    outer.setAttribute('data-prosemirror-content-type', 'node');
    outer.setAttribute('data-prosemirror-node-name', 'codeBlock');
    outer.setAttribute('data-prosemirror-node-block', 'true');
    outer.contentEditable = 'false';
    outer.style.cssText = `
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
    background: #FFFFFF;
    border-radius: 3px;
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: .875rem;
    line-height: 1.5rem;
    min-width: 48px;
    cursor: pointer;
    clear: both;
    white-space: normal;
  `;

    // ── Scroller (gutters + content side by side) ──────────────
    const scroller = document.createElement('div');
    scroller.className = 'cm-scroller';
    scroller.style.cssText = `
    display: flex;
    align-items: flex-start;
    height: 100%;
    overflow-x: auto;
    position: relative;
    z-index: 0;
    overflow-anchor: none;
    background-color: #0515240F;
    line-height: unset;
    border-radius: 4px;
    background-image: linear-gradient(to right, #0515240F 24px, transparent 24px), linear-gradient(to right, #FFFFFF 24px, transparent 24px), linear-gradient(to left, #0515240F 8px, transparent 8px), linear-gradient(to left, #FFFFFF 8px, transparent 8px), linear-gradient(to left, #1E1F2129 0, transparent 8px), linear-gradient(to left, #1E1F211f 0, transparent 8px), linear-gradient(to right, #1E1F2129) 0, transparent 8px), linear-gradient(to right,  #1E1F211f 0, transparent 8px);
    background-attachment: local, local, local, local, scroll, scroll, scroll, scroll;
  `;
    outer.appendChild(scroller);

    // ── Gutters (line numbers) ─────────────────────────────────
    const gutters = document.createElement('div');
    gutters.className = 'cm-gutters';
    gutters.setAttribute('aria-hidden', 'true');
    gutters.style.cssText = `
          flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    inset-inline-start: 0;
    z-index: 200;
    background-color: #0515240F;
    border: none;
    padding: 0;
    color: #6B6E76;
    min-height: 64px;
  `;
    scroller.appendChild(gutters);

    const guttersContainer = document.createElement('div');
    guttersContainer.classList.add('cm-gutter');
    guttersContainer.classList.add('cm-lineNumbers');
    guttersContainer.style.cssText = `
          padding: 8px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-sizing: border-box;
          min-height: 100%;
          overflow: hidden;
          `;
    gutters.appendChild(guttersContainer);

    // ── Content area (textarea) ────────────────────────────────
    const content = document.createElement('div');
    content.className = 'cm-content';
    content.style.cssText = `
    flex: 1;
    position: relative;
    overflow: hidden;
  `;
    scroller.appendChild(content);

    const textarea = document.createElement('textarea');
    textarea.className = 'cm-textarea';
    textarea.setAttribute('aria-label', 'Code snippet');
    textarea.setAttribute('autocorrect', 'off');
    textarea.setAttribute('autocapitalize', 'off');
    textarea.setAttribute('spellcheck', 'false');
    textarea.value = currentCode;
    textarea.style.cssText = `
          tab-size: 4;
          -webkit-user-modify: read-write-plaintext-only;
          cursor: text;
          caret-color: #292A2E;

          flex-grow: 2;
          flex-shrink: 0;
          display: block;
          white-space: pre;
          word-wrap: normal;
          box-sizing: border-box;
          min-height: 100%;
          outline: none;
          margin: 8px;

          display: block;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: inherit;
          font-size: inherit;
          line-height: 1.5rem;
          white-space: pre;
          overflow: hidden;
          box-sizing: border-box;
        `;
    content.appendChild(textarea);

    // ── Line number helpers ────────────────────────────────────
    const updateLineNumbers = (code: string) => {
      const lineCount = code.split('\n').length;
      guttersContainer.innerHTML = '';
      for (let i = 1; i <= lineCount; i++) {
        const el = document.createElement('div');
        el.className = 'cm-gutterElement';
        el.style.cssText = `min-height: 1.5rem; padding: 0 3px 0 5px; text-align: right; white-space: nowrap; box-sizing: border-box;`;
        el.textContent = String(i);
        guttersContainer.appendChild(el);
      }
    };

    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    updateLineNumbers(currentCode);

    // ── Sync textarea → ProseMirror ────────────────────────────
    textarea.addEventListener('input', () => {
      currentCode = textarea.value;
      updateLineNumbers(currentCode);
      autoResize();

      const pos = getPos();
      if (pos == null) return;

      const start = pos + 1; // inside the node
      const end = pos + 1 + view.state.doc.nodeAt(pos)!.content.size;

      view.dispatch(
        view.state.tr.replaceWith(
          start,
          end,
          currentCode ? view.state.schema.text(currentCode) : [],
        ),
      );
    });

    // Tab key → insert spaces instead of focusing next element
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value =
          textarea.value.substring(0, start) +
          '    ' +
          textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        textarea.dispatchEvent(new Event('input'));
      }

      // Escape → return focus to ProseMirror
      if (e.key === 'Escape') {
        view.focus();
      }
    });

    // Prevent ProseMirror from stealing clicks inside the editor
    textarea.addEventListener('mousedown', (e) => e.stopPropagation());
    textarea.addEventListener('click', (e) => e.stopPropagation());

    // ── nodeView return ────────────────────────────────────────
    return {
      dom: outer,
      // No contentDOM — we manage content ourselves via the textarea
      update(updatedNode: Node) {
        if (updatedNode.type !== node.type) return false;

        // Only update textarea if content changed externally (undo/redo/collab)
        const newCode = updatedNode.textContent;
        if (newCode !== currentCode) {
          currentCode = newCode;
          textarea.value = currentCode;
          updateLineNumbers(currentCode);
          autoResize();
        }
        return true;
      },
      stopEvent(e: Event) {
        // Let all events inside the textarea be handled natively
        return e.target === textarea;
      },
      ignoreMutation() {
        // We manage DOM ourselves — ignore all mutations
        return true;
      },
    };
  }

  public ngOnDestroy() {
    this.view()?.destroy();
  }
}
