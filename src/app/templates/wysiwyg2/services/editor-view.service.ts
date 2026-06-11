import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  inject,
  Injectable,
  Injector,
  OutputEmitterRef,
  signal,
  Type,
  WritableSignal,
} from '@angular/core';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { Schema, DOMParser as ProseMirrorDOMParser, DOMSerializer, Node } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { splitListItem } from 'prosemirror-schema-list';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import {
  tableNodes,
  tableEditing,
  columnResizing,
  CellSelection,
  goToNextCell,
} from 'prosemirror-tables';
import 'prosemirror-tables/style/tables.css';
import { EditorExpandTitleComponent } from '../components/editor-expand-title/editor-expand-title.component';
import { EditorPanelComponent, PanelType } from '../components/editor-panel/editor-panel.component';
import { taskItemNodeView } from './helpers/task-item.node-view';
import { codeBlockNodeView } from './helpers/code-block.node-view';
import { expandNodeView } from './helpers/expand.node-view';
import { blockquoteNodeView } from './helpers/block-quote.node-view';
import { horizontalRuleNodeView } from './helpers/horizontal-rule.node-view';
import { panelNodeView } from './helpers/panel.node-view';
import { tableControlsPlugin } from './helpers/table/table-controls.plugin';
import { tableNodeView } from './helpers/table/table.node-view';
import { tableRowNodeView } from './helpers/table/table-row.node-view';
import { tableCellNodeView, tableHeaderNodeView } from './helpers/table/table-cell.node-view';
import { mediaSingleNodeView } from './helpers/media-single.node-view';

export interface MountFn {
  <T>(component: Type<T>, inputs: Partial<T>): { element: HTMLElement; ref: ComponentRef<T> };
}

@Injectable({
  providedIn: 'any',
})
export class EditorViewService {
  public state: WritableSignal<EditorState> = signal<EditorState>(null!);
  public view: WritableSignal<EditorView> = signal<EditorView>(null!);
  public schema: WritableSignal<Schema> = signal<Schema>(null!);

  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  // Track component refs for cleanup
  private componentRefs: ComponentRef<any>[] = [];

  public createView(
    value: string,
    node: HTMLElement | null,
    valueChange: OutputEmitterRef<string>,
  ) {
    if (!node) {
      console.warn('editor element not passed');
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

          const html = DOMSerializer.fromSchema(schema).serializeFragment(newState.doc.content);
          valueChange.emit(html.textContent ?? '');
        },
        nodeViews: {
          task_item: (node, view, getPos) => taskItemNodeView(node, view, getPos),
          code_block: (node, view, getPos) => codeBlockNodeView(node, view, getPos),
          expand: (node, view, getPos) =>
            expandNodeView(this.mountComponent.bind(this), node, view, getPos),
          panel: (node, view, getPos) =>
            panelNodeView(this.mountComponent.bind(this), node, view, getPos),
          blockquote: (node, view, getPos) => blockquoteNodeView(node, view, getPos),
          horizontal_rule: (node, view, getPos) => horizontalRuleNodeView(node, view, getPos),
          table: (node, view, getPos) => tableNodeView(node, view, getPos),
          table_row: (node, view, getPos) => tableRowNodeView(node, view, getPos),
          table_cell: (node, view, getPos) => tableCellNodeView(node, view, getPos),
          table_header: (node, view, getPos) => tableHeaderNodeView(node, view, getPos),
          media_single: (node, view, getPos) => mediaSingleNodeView(node, view, getPos),
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
      toDOM: (node: any) => ['img', { src: node.attrs['src'], alt: node.attrs['alt'] || '' }],
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
              indentLevel: +(el as HTMLElement).getAttribute('data-indent-level')! || 1,
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
              indentLevel: +(el as HTMLElement).getAttribute('data-indent-level')! || 1,
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
        toDOM: () => ['div', { 'data-node-type': 'taskList', class: 'task-list' }, 0] as any,
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

    nodes = nodes.append({
      expand: {
        group: 'block',
        content: 'block+',
        defining: true,
        attrs: {
          title: { default: '' },
          expanded: { default: true },
        },
        parseDOM: [
          {
            tag: 'div[data-node-type="expand"]',
            getAttrs: (el: HTMLElement) => ({
              title: el.getAttribute('data-title') || '',
              expanded: el.classList.contains('ak-editor-expand__expanded'),
            }),
          },
        ],
        toDOM: (node) => [
          'div',
          {
            'data-node-type': 'expand',
            'data-title': node.attrs['title'] || '',
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'expand',
            'data-prosemirror-node-block': 'true',
            class: [
              'ak-editor-expand',
              'ak-editor-expand__type-expand',
              node.attrs['expanded'] ? 'ak-editor-expand__expanded' : '',
            ]
              .filter(Boolean)
              .join(' '),
          },
          0,
        ],
      },
    });

    nodes = nodes.append({
      panel: {
        group: 'block',
        content: '(paragraph | heading | code_block | bullet_list | ordered_list | task_list)+',
        defining: true,
        attrs: {
          panelType: { default: 'info' },
        },
        parseDOM: [
          {
            tag: 'div[data-panel-type]',
            getAttrs: (el: HTMLElement) => ({
              panelType: el.getAttribute('data-panel-type') || 'info',
            }),
          },
        ],
        toDOM: (node) => [
          'div',
          {
            'data-panel-type': node.attrs['panelType'],
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'panel',
            'data-prosemirror-node-block': 'true',
            class: 'ak-editor-panel',
          },
          0,
        ],
      },
    });

    nodes = nodes.append({
      blockquote: {
        group: 'block',
        content: 'paragraph | bullet_list | ordered_list | task_list | code_block',
        defining: true,
        parseDOM: [{ tag: 'blockquote' }],
        toDOM: () => [
          'blockquote',
          {
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'blockquote',
            'data-prosemirror-node-block': 'true',
          },
          0,
        ],
      },
    });

    nodes = nodes.append({
      horizontal_rule: {
        group: 'block',
        parseDOM: [{ tag: 'hr' }],
        toDOM: () => [
          'hr',
          {
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'horizontal_rule',
            'data-prosemirror-node-block': 'true',
          },
        ],
      },
    });

    nodes = nodes.append({
      media_single: {
        group: 'block',
        attrs: {
          src: { default: '' },
          alt: { default: '' },
          width: { default: null },
          layout: { default: 'center' },
        },
        parseDOM: [
          {
            tag: 'div[data-node-type="mediaSingle"]',
            getAttrs: (el: HTMLElement) => ({
              src: el.querySelector('img')?.getAttribute('src') || '',
              alt: el.querySelector('img')?.getAttribute('alt') || '',
              width: el.getAttribute('data-width') ? Number(el.getAttribute('data-width')) : null,
              layout: el.getAttribute('data-layout') || 'center',
            }),
          },
        ],
        toDOM: (node) => [
          'div',
          {
            'data-node-type': 'mediaSingle',
            'data-width': node.attrs['width'] != null ? String(node.attrs['width']) : '',
            'data-layout': node.attrs['layout'] || 'center',
            'data-prosemirror-content-type': 'node',
            'data-prosemirror-node-name': 'media_single',
            'data-prosemirror-node-block': 'true',
          },
          ['img', { src: node.attrs['src'], alt: node.attrs['alt'] || '' }],
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
        toDOM: () => ['span', { style: 'text-decoration: overline' }, 0] as const,
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
        toDOM: (mark: any) => ['span', { style: `color: ${mark.attrs['color']}` }],
      },
    });
    nodes = nodes.append({
      emoji: {
        parseDOM: [{ tag: 'span' }],
        toDOM: () => ['span', 0] as const,
      },
    });

    const tNodes = tableNodes({
      tableGroup: 'block',
      cellContent: 'block+', // ✅ allows paragraphs, lists, code blocks inside cells
      cellAttributes: {
        background: {
          default: null,
          getFromDOM: (el) => el.style.backgroundColor || null,
          setDOMAttr: (val, attrs) => {
            if (val) attrs['style'] = (attrs['style'] || '') + `background-color: ${val};`;
          },
        },
        rowspan: { default: 1 },
        colspan: { default: 1 },
      },
    });

    const tableSpec = tNodes['table'];
    (tNodes as any)['table'] = {
      ...tableSpec,
      attrs: {
        ...(tableSpec.attrs || {}),
        width: { default: null },
      },
      parseDOM: [
        {
          tag: 'table',
          getAttrs: (dom: HTMLElement | string) => {
            if (typeof dom === 'string') {
              return { width: null };
            }

            const element = dom;
            const dataWidth = element.getAttribute('data-table-width');
            const styleWidth = element.style.width;

            const parsedWidth = dataWidth
              ? Number(dataWidth)
              : styleWidth.endsWith('px')
                ? Number(styleWidth.replace('px', ''))
                : null;

            return {
              width:
                typeof parsedWidth === 'number' && Number.isFinite(parsedWidth)
                  ? parsedWidth
                  : null,
            };
          },
        },
      ],
      toDOM: (node: any) => {
        const attrs: Record<string, string> = {};
        const width = node.attrs['width'];

        if (typeof width === 'number' && Number.isFinite(width) && width > 0) {
          attrs['data-table-width'] = String(width);
          attrs['style'] = `width: ${width}px;`;
        }

        return ['table', attrs, ['tbody', 0]] as any;
      },
    };

    const tableRowSpec = tNodes['table_row'];
    (tNodes as any)['table_row'] = {
      ...tableRowSpec,
      attrs: {
        ...(tableRowSpec.attrs || {}),
        height: { default: 0 },
      },
      parseDOM: [
        {
          tag: 'tr',
          getAttrs: (dom: HTMLElement | string) => {
            if (typeof dom === 'string') {
              return { height: 0 };
            }

            const dataHeight = dom.getAttribute('data-row-height');
            const styleHeight = dom.style.height;
            const parsedHeight = dataHeight
              ? Number(dataHeight)
              : styleHeight.endsWith('px')
                ? Number(styleHeight.replace('px', ''))
                : 0;

            return {
              height:
                typeof parsedHeight === 'number' &&
                Number.isFinite(parsedHeight) &&
                parsedHeight > 0
                  ? parsedHeight
                  : 0,
            };
          },
        },
      ],
      toDOM: (node: any) => {
        const attrs: Record<string, string> = {};
        const height = node.attrs['height'];

        if (typeof height === 'number' && Number.isFinite(height) && height > 0) {
          attrs['data-row-height'] = String(height);
          attrs['style'] = `height: ${height}px;`;
        }

        return ['tr', attrs, 0] as any;
      },
    };

    nodes = nodes.append(tNodes);

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
        columnResizing(),
        tableEditing(),
        tableControlsPlugin(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-b': toggleMark(schema.marks['strong']),
          Tab: goToNextCell(1),
          'shift-Tab': goToNextCell(-1),
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

  private mountComponent<T>(
    component: Type<T>,
    inputs: Partial<T> = {},
  ): { element: HTMLElement; ref: ComponentRef<T> } {
    const ref = createComponent(component, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector,
    });

    // Pass inputs
    Object.entries(inputs).forEach(([key, value]) => {
      ref.setInput(key, value);
    });

    // Do NOT use appRef.attachView() — it hooks into global change detection
    // and causes NG0103 infinite loops with ProseMirror's DOM mutations.
    // Instead, manually trigger initial render with OnPush + detectChanges().
    ref.changeDetectorRef.detectChanges();

    const element = ref.location.nativeElement as HTMLElement;
    return { element, ref };
  }

  private buildTableToolbar(
    view: EditorView,
    getPos: () => number | undefined,
    wrapper: HTMLElement,
  ): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.contentEditable = 'false';
    toolbar.style.cssText = `
    display: none;
    position: absolute;
    bottom: -44px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFFFFF;
    border: 1px solid #DFE1E6;
    border-radius: 6px;
    padding: 6px 8px;
    gap: 4px;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    z-index: 20;
    white-space: nowrap;
  `;

    const makeBtn = (label: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `
      background: none; border: none; padding: 4px 8px;
      cursor: pointer; border-radius: 3px; font-size: 13px;
      color: #172B4D; display: flex; align-items: center; gap: 4px;
    `;
      btn.textContent = label;
      btn.addEventListener('mouseenter', () => (btn.style.background = '#F1F2F4'));
      btn.addEventListener('mouseleave', () => (btn.style.background = 'none'));
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      return btn;
    };

    const sep = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:1px;height:20px;background:#DFE1E6;margin:0 2px;`;
      return d;
    };

    toolbar.appendChild(
      makeBtn('⊞ Table options', () => {
        // future: open table options panel
      }),
    );
    toolbar.appendChild(sep());
    toolbar.appendChild(
      makeBtn('↕ Row', () => {
        // future: toggle header row
      }),
    );
    toolbar.appendChild(sep());
    toolbar.appendChild(
      makeBtn('⊞', () => {
        // future: toggle numbered rows
      }),
    );
    toolbar.appendChild(sep());

    // Delete table
    const deleteBtn = makeBtn('🗑', () => {
      const pos = getPos();
      if (pos == null) return;
      const n = view.state.doc.nodeAt(pos);
      if (!n) return;
      view.dispatch(view.state.tr.delete(pos, pos + n.nodeSize));
    });
    toolbar.appendChild(deleteBtn);

    return toolbar;
  }

  public ngOnDestroy() {
    this.view()?.destroy();
  }
}
