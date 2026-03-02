import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  Schema,
  DOMParser as ProseMirrorDOMParser,
  DOMSerializer,
} from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { inputRules } from 'prosemirror-inputrules';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { toggleMark, setBlockType, wrapIn, lift } from 'prosemirror-commands';
import {
  wrapInList,
  splitListItem,
  liftListItem,
} from 'prosemirror-schema-list';

import { OverlayService } from '../../services/overlay-service/overlay-service';
import { WysiwygEditorImage2Service } from './services/editor-image.service';
import {
  FLOAT_BOTTOM_POSITION,
  FLOAT_TOP_POSITION,
} from '../wysiwyg/wysiwyg.models';
import { OptionWrapper } from '../option-wrapper/option-wrapper';
import { OptionsList } from '../option-wrapper/option-wrapper.model';
import { HttpService } from '../../services/http-service/http-service';
import { TextField } from '../text-field/text-field';
import { TabComponent } from '../../components/dashboards/_components/tabs/tabs';

@Component({
  selector: 'wysiwyg2',
  imports: [TextField, TabComponent],
  templateUrl: './wysiwyg2.html',
  styleUrl: './wysiwyg2.scss',
})
export class Wysiwyg2 implements OnInit, AfterViewInit, OnDestroy {
  private httpService = inject(HttpService);
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);
  protected editorImageService = inject(WysiwygEditorImage2Service);

  private readonly editorRef = viewChild<ElementRef>('editor');
  private readonly colorPickerTemplate = viewChild('colorPickerTemplate', {
    read: TemplateRef,
  });
  private readonly uploadMultiMediaTemplate = viewChild(
    'uploadMultiMediaTemplate',
    { read: TemplateRef },
  );

  @Input() value: string = ''; // initial HTML
  @Output() valueChange = new EventEmitter<string>();

  private view!: EditorView;
  private schema!: Schema;

  protected colorPallettes: any[] = [];
  protected textFormatOptions: OptionsList[] = [];
  protected textStyleOptions: OptionsList[] = [];
  protected listsOptions: OptionsList[] = [];

  // ────────────────────────────── Schema (with image + color) ──────────────────────────────
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
              style: 'list-style-type: decimal;padding-left: 1.25rem;display: flow-root;box-sizing: border-box;'
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
              style: 'list-style-type: disc;padding-left: 1.25rem;display: flow-root;box-sizing: border-box;'
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

    this.schema = new Schema({ nodes, marks });
  }

  // ────────────────────────────── Lifecycle ──────────────────────────────
  ngOnInit() {
    this.httpService.getWysiwygEditorConfig().subscribe((res) => {
      const {
        textFormatOptions,
        textStyleOptions,
        listsOptions,
        colorPickerOptions,
      } = res;
      this.colorPallettes = colorPickerOptions;
      this.textFormatOptions = textFormatOptions;
      this.textStyleOptions = textStyleOptions;
      this.listsOptions = listsOptions;
    });
  }

  ngAfterViewInit() {
    this.createSchema();

    const state = EditorState.create({
      schema: this.schema,
      doc: this.value
        ? ProseMirrorDOMParser.fromSchema(this.schema).parse(
            new DOMParser().parseFromString(this.value, 'text/html').body,
          )
        : undefined,
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-b': toggleMark(this.schema.marks['strong']),
        }),
        // List keymap — must come before baseKeymap so Enter is handled in lists
        // Try task_item first, then list_item
        keymap({
          Enter: (state, dispatch, view) =>
            splitListItem(this.schema.nodes['task_item'])(state, dispatch) ||
            splitListItem(this.schema.nodes['list_item'])(state, dispatch),
          'Shift-Enter': (state: any, dispatch: any) => {
            const br = this.schema.nodes['hard_break'].create();
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

    this.view = new EditorView(this.editorRef()!.nativeElement, {
      state,
      dispatchTransaction: (tr) => {
        const newState = this.view.state.apply(tr);
        this.view.updateState(newState);

        // Emit clean HTML on every change
        const html = DOMSerializer.fromSchema(this.schema).serializeFragment(
          newState.doc.content,
        );
        const div = document.createElement('div');
        div.appendChild(html);
        this.valueChange.emit(div.innerHTML);
      },
      nodeViews: {
        task_item: (node, view, getPos) => {
          // Outer container
          const outer = document.createElement('div');
          outer.classList.add('taskItemView-content-wrap');
          outer.style.cssText = `
            list-style: none;
            min-width: 48px;
            position: relative;
          `;
          outer.dataset['taskState'] = node.attrs['checked'] ? 'DONE' : 'TODO';
          outer.dataset['localId'] =
            node.attrs['localId'] || crypto.randomUUID();

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
            update(updatedNode) {
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
        },
      },
    });
  }

  ngOnDestroy() {
    this.view?.destroy();
  }

  // ────────────────────────────── Public API for your toolbar ──────────────────────────────
  // These are the only methods you will call from your buttons/overlays

  toggleBold() {
    toggleMark(this.schema.marks['strong'])(
      this.view.state,
      this.view.dispatch,
    );
  }
  toggleItalic() {
    toggleMark(this.schema.marks['em'])(this.view.state, this.view.dispatch);
  }
  toggleUnderline() {
    toggleMark(this.schema.marks['u'])(this.view.state, this.view.dispatch);
  }
  toggleOverline() {
    toggleMark(this.schema.marks['o'])(this.view.state, this.view.dispatch);
  }
  toggleUnderlineSquiggle() {
    toggleMark(this.schema.marks['us'])(this.view.state, this.view.dispatch);
  }
  toggleStrikethrough() {
    toggleMark(this.schema.marks['s'])(this.view.state, this.view.dispatch);
  }
  toggleSubscript() {
    toggleMark(this.schema.marks['sub'])(this.view.state, this.view.dispatch);
  }
  toggleSuperscript() {
    toggleMark(this.schema.marks['sup'])(this.view.state, this.view.dispatch);
  }
  toggleCode() {
    toggleMark(this.schema.marks['code'])(this.view.state, this.view.dispatch);
  }

  setHeading(level: number) {
    setBlockType(this.schema.nodes['heading'], { level })(
      this.view.state,
      this.view.dispatch,
    );
  }

  setParagraph() {
    setBlockType(this.schema.nodes['paragraph'])(
      this.view.state,
      this.view.dispatch,
    );
  }

  toggleBulletList() {
    const listType = this.schema.nodes['bullet_list'];
    const itemType = this.schema.nodes['list_item'];
    // If already inside a list, lift out; otherwise wrap in list
    if (!wrapInList(listType)(this.view.state)) {
      liftListItem(itemType)(this.view.state, this.view.dispatch);
    } else {
      wrapInList(listType)(this.view.state, this.view.dispatch);
    }
  }

  toggleOrderedList() {
    const listType = this.schema.nodes['ordered_list'];
    const itemType = this.schema.nodes['list_item'];
    if (!wrapInList(listType)(this.view.state)) {
      liftListItem(itemType)(this.view.state, this.view.dispatch);
    } else {
      wrapInList(listType)(this.view.state, this.view.dispatch);
    }
  }

  toggleTaskList() {
    const taskListType = this.schema.nodes['task_list'];
    const taskItemType = this.schema.nodes['task_item'];
    // Try wrapping; if not possible (already in task list), lift out
    if (!wrapInList(taskListType)(this.view.state)) {
      liftListItem(taskItemType)(this.view.state, this.view.dispatch);
    } else {
      wrapInList(taskListType)(this.view.state, this.view.dispatch);
    }
  }

  liftList() {
    lift(this.view.state, this.view.dispatch);
  }

  setTextColor(hex: string) {
    toggleMark(this.schema.marks['color'], { color: '#' + hex })(
      this.view.state,
      this.view.dispatch,
    );
  }

  insertImage(src: string, alt = '') {
    const node = this.schema.nodes['image'].create({ src, alt });
    this.view.dispatch(this.view.state.tr.replaceSelectionWith(node));
    this.view.focus();
  }

  // Undo / Redo (if you want toolbar buttons)
  undo() {
    undo(this.view.state, this.view.dispatch);
  }
  redo() {
    redo(this.view.state, this.view.dispatch);
  }

  focus() {
    this.view.focus();
  }

  protected onTextStylesClick(element: Element) {
    const optionListsConfig = {
      optionLists: this.textStyleOptions,
      handleOptionEvent: (option: any) => {
        switch (option.id) {
          case 'strong':
            this.toggleBold();
            break;
          case 'em':
            this.toggleItalic();
            break;
          case 'u':
            this.toggleUnderline();
            break;
          case 'us':
            this.toggleUnderlineSquiggle();
            break;
          case 's':
            this.toggleStrikethrough();
            break;
          case 'o':
            this.toggleOverline();
            break;
          case 'code':
            this.toggleCode();
            break;
          case 'sub':
            this.toggleSubscript();
            break;
          case 'sup':
            this.toggleSuperscript();
            break;
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  // For color picker (already in your template)
  protected onColorSelect(colorHexCode: string) {
    this.setTextColor(colorHexCode);
    this.overlayService.close(); // optional
  }

  // For image upload (your existing onUploadingFile, onInsertUrlImage, onCaptureClick)
  // protected onUploadingFile(...) {
  //   // ... get dataUrl
  //   this.insertImage(dataUrl, file.name);
  //   this.closeOverlay();
  // }

  // protected onInsertUrlImage() {
  //   this.insertImage(this.imgPreviewLink());
  //   this.closeOverlay();
  // }

  protected onTextFormatClick(element: HTMLElement) {
    const optionListsConfig = {
      optionLists: this.textFormatOptions,
      handleOptionEvent: (option: any) => {
        if (option.id.includes('h')) {
          this.setHeading(option.id.split('h').pop());
        } else {
          this.setParagraph();
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onListClick(element: HTMLElement) {
    const optionListsConfig = {
      optionLists: this.listsOptions,
      handleOptionEvent: (option: any) => {
        switch (option.id) {
          case 'ul':
            this.toggleBulletList();
            break;
          case 'ol':
            this.toggleOrderedList();
            break;
          case 'taskList':
            this.toggleTaskList();
            break;
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onColorPickerClick(element: HTMLElement) {
    this.overlayService.open({
      template: this.colorPickerTemplate(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onMultiMediaUploadClick(element: HTMLElement) {
    this.overlayService.open({
      template: this.uploadMultiMediaTemplate(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }
  protected onUploadFileClick() {
    const fileInputElement = document.createElement('input');
    fileInputElement.type = 'file';
    fileInputElement.accept = 'image/*';
    fileInputElement.click();
    fileInputElement.onchange = (event: any) => {
      const file = event.target.files[0];
      this.insertImage(file, file.name);
    };
  }
  protected onInsertUrlImage() {
    this.insertImage(this.editorImageService.imgPreviewLink());
  }
}
