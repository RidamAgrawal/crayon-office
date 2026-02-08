import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../option-wrapper/option-wrapper';

@Component({
  selector: 'wysiwyg-editor',
  templateUrl: './wysiwyg.component.html',
  styleUrl: './wysiwyg.component.scss',
})
export class WysiwygEditorComponent {
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);
  private readonly editor = viewChild('editor', {
    read: ElementRef,
  });
  private readonly colorPickerTemplate = viewChild('colorPickerTemplate', {
    read: TemplateRef,
  });

  @Output()
  valueChange = new EventEmitter<string>();

  private savedRange = signal<Range | null>(null);

  private readonly rangeEffect = effect(() => {
    console.log(this.savedRange());
  });

  // Prevent editor losing focus when clicking toolbar
  preventBlur(event: MouseEvent) {
    event.preventDefault();
  }

  format(command: string, value?: string) {
    this.restoreSelection();
    document.execCommand(command, false, value);
    this.saveSelection();
    this.emitValue();
  }

  onInput() {
    this.saveSelection();
    this.emitValue();
  }

  onFocus() {
    this.saveSelection();
  }

  onBlur() {
    this.saveSelection();
  }

  private emitValue() {
    const html = this.editor()?.nativeElement.innerHTML;
    this.valueChange.emit(html);
  }

  // ---- Selection handling ----
  private saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedRange.set(selection.getRangeAt(0));
    }
  }

  private restoreSelection() {
    if (this.savedRange()) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedRange()!);
    }
  }

  protected onTextFormatClick(elementRef: Element) {
    const optionListsConfig = {
      optionLists: [
        {
          options: [
            {
              icon: 'formatText',
              id: 'p',
              label: 'Normal Text',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH1',
              id: 'h1',
              label: 'Heading H1',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH2',
              id: 'h2',
              label: 'Heading H2',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH3',
              id: 'h3',
              label: 'Heading H3',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH4',
              id: 'h4',
              label: 'Heading H4',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH5',
              id: 'h5',
              label: 'Heading H5',
              type: 'button',
              visible: true,
            },
            {
              icon: 'formatH6',
              id: 'h6',
              label: 'Heading H6',
              type: 'button',
              visible: true,
            },
          ],
        },
      ],
      handleOptionEvent: (option: any) => {
        this.applyBlockFormat(option.id);
        this.normalizeBlocks();
      },
    };
    const optionsOverlayRef = this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: {
        optionListsConfig,
      },
      positions: [
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ],
    });
  }

  protected onTextStylesClick(elementRef: Element) {
    const optionListsConfig = {
      optionLists: [
        {
          options: [
            {
              icon: 'formatText',
              id: 'p',
              label: 'Normal Text',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textBold',
              id: 'strong',
              label: 'Bold',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textItalic',
              id: 'em',
              label: 'Italic',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textUnderline',
              id: 'u',
              label: 'Underline',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textUnderlineSquiggle',
              id: 'u',
              label: 'Underline Squiggle',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textStrikethrough',
              id: 's',
              label: 'Strikethrough',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textOverline',
              id: 'overline',
              label: 'Overline',
              type: 'button',
              visible: true,
            },
            {
              icon: 'codeSnippet',
              id: 'code',
              label: 'Code',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textSubscript',
              id: 'sub',
              label: 'Subscript',
              type: 'button',
              visible: true,
            },
            {
              icon: 'textSuperscript',
              id: 'sup',
              label: 'Superscript',
              type: 'button',
              visible: true,
            },
          ],
        },
      ],
      handleOptionEvent: (option: any) => {
        this.toggleInline(option.id, this.editor()?.nativeElement);
        this.normalizeInline(this.editor()?.nativeElement);
      },
    };
    const optionsOverlayRef = this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: {
        optionListsConfig,
      },
      positions: [
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ],
    });
  }

  private applyBlockFormat(tag: string) {
    this.restoreSelection();

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // 🔑 THIS is the fix
    let block = this.findBlockElement(range.startContainer);
    const newBlock = document.createElement(tag);
    if (!block) {
      newBlock.appendChild(range.startContainer);
      range.deleteContents();
      range.insertNode(newBlock);
    } else {
      // If same tag, do nothing
      if (block.tagName === tag.toUpperCase()) return;

      newBlock.innerHTML = block.innerHTML;

      block.replaceWith(newBlock);
    }
    // Restore cursor
    range.selectNodeContents(newBlock);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    this.saveSelection();
    this.emitValue();
  }

  private findBlockElement(node: Node): HTMLElement | null {
    let current: Node | null = node;

    while (current && current !== this.editor()?.nativeElement) {
      if (
        current instanceof HTMLElement &&
        /^(P|H[1-6]|DIV)$/.test(current.tagName)
      ) {
        return current;
      }
      current = current.parentNode;
    }

    return null;
  }

  private normalizeBlocks() {
    const root = this.editor()?.nativeElement;

    root?.querySelectorAll('div').forEach((div: HTMLDivElement) => {
      const p = document.createElement('p');
      p.innerHTML = div.innerHTML || '<br>';
      div.replaceWith(p);
    });
  }

  private findAncestor(
    node: Node,
    tag: string,
    root: HTMLElement,
  ): HTMLElement | null {
    while (node && node !== root) {
      if (node instanceof HTMLElement && node.tagName === tag.toUpperCase()) {
        return node;
      }
      node = node.parentNode!;
    }
    return null;
  }

  private toggleInline(tag: string, editor: HTMLElement) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const startAncestor = this.findAncestor(range.startContainer, tag, editor);
    const endAncestor = this.findAncestor(range.endContainer, tag, editor);

    // CASE 1: fully inside same formatting → UNWRAP
    if (startAncestor && startAncestor === endAncestor) {
      this.unwrapElement(startAncestor);
      return;
    }

    // CASE 2: partially formatted or unformatted → APPLY
    this.applyInline(tag, range, selection);
  }

  private applyInline(tag: string, range: Range, selection: Selection) {
    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    // Restore selection
    range.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private unwrapElement(element: HTMLElement) {
    const parent = element.parentNode;
    if (!parent) return;

    const contents = document.createDocumentFragment();
    while (element.firstChild) {
      contents.appendChild(element.firstChild);
    }
    parent.replaceChild(contents, element);
  }

  private normalizeInline(root: HTMLElement) {
    root.querySelectorAll('strong, em, u, s, code, sub, sup').forEach((el) => {
      const next = el.nextSibling;
      if (next instanceof HTMLElement && next.tagName === el.tagName) {
        el.innerHTML += next.innerHTML;
        next.remove();
      }
    });
  }

  protected onListClick(elementRef: Element) {
    const optionListsConfig = {
      optionLists: [
        {
          options: [
            {
              icon: 'bulletedList',
              id: 'ul',
              label: 'Bulleted List',
              type: 'button',
              visible: true,
            },
            {
              icon: 'numberedList',
              id: 'ol',
              label: 'Numbered List',
              type: 'button',
              visible: true,
            },
            {
              icon: 'checkList',
              id: 'ul',
              label: 'Check List',
              type: 'button',
              visible: true,
            },
          ],
        },
      ],
      handleOptionEvent: (option: any) => {
        this.applyBulletedList(option.id);
      },
    };
    const optionsOverlayRef = this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: {
        optionListsConfig,
      },
      positions: [
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ],
    });
  }

  private applyBulletedList(tag: string) {
    this.restoreSelection();

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    // if (range.collapsed) return;

    let block = this.findBlockElement(range.startContainer);
    const newListBlock = document.createElement(tag);
    const listItem = document.createElement('li');
    if (!block) {
      newListBlock.appendChild(listItem);
      listItem.appendChild(range.startContainer);
      range.deleteContents();
      range.insertNode(newListBlock);
    } else {
      // If same tag, do nothing
      if (block.tagName === tag.toUpperCase()) return;

      listItem.innerHTML = block.innerHTML;
      newListBlock.appendChild(listItem);
      block.replaceWith(newListBlock);
    }
    // Restore cursor
    range.selectNodeContents(newListBlock);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    this.saveSelection();
    this.emitValue();
  }

  protected showColorPicker(elementRef: Element) {
    const colorPickerTemplateRef = this.colorPickerTemplate;
    if (!colorPickerTemplateRef()) return;
    const colorPickerOverlayRef = this.overlayService.open({
      template: colorPickerTemplateRef!(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(elementRef),
      positions: [
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'center',
          overlayX: 'center',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ],
    });
  }
}
