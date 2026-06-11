import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../option-wrapper/option-wrapper';
import { TabComponent } from '../../components/dashboards/_components/tabs/tabs';
import { TextField } from '../text-field/text-field';
import { WysiwygEditorImageService } from './services/editor-image.service';
import { FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION } from './wysiwyg.models';
import { HttpService } from '../../services/http-service/http-service';
import { OptionsList } from '../option-wrapper/option-wrapper.model';
import { EditorSelectionService } from './services/editor-selection.service';
import { take } from 'rxjs';

@Component({
  selector: 'wysiwyg-editor',
  templateUrl: './wysiwyg.component.html',
  styleUrl: './wysiwyg.component.scss',
  standalone: true,
  imports: [TabComponent, TextField],
})
export class WysiwygEditorComponent implements AfterViewInit, OnDestroy {
  private readonly httpService = inject(HttpService);
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);
  protected editorImageService = inject(WysiwygEditorImageService);

  private editorSelectionService = new EditorSelectionService();

  private readonly editor = viewChild('editor', { read: ElementRef });
  private readonly colorPickerTemplate = viewChild('colorPickerTemplate', {
    read: TemplateRef,
  });
  private readonly uploadMultiMediaTemplate = viewChild('uploadMultiMediaTemplate', {
    read: TemplateRef,
  });

  protected readonly imgPreviewLink = signal<string>('');

  @Output()
  valueChange = new EventEmitter<string>();

  protected colorPallettes: any[] = [];
  protected textFormatOptions: OptionsList[] = [];
  protected textStyleOptions: OptionsList[] = [];
  protected listsOptions: OptionsList[] = [];

  // ──────────────────────────── lifecycle ────────────────────────────────

  ngAfterViewInit() {
    const el = this.editor()?.nativeElement;
    if (el) {
      this.editorSelectionService.setEditor(el);
    }
  }

  ngOnInit() {
    this.httpService.getWysiwygEditorConfig().subscribe((res) => {
      const { textFormatOptions, textStyleOptions, listsOptions, colorPickerOptions } = res;
      this.colorPallettes = colorPickerOptions;
      this.textFormatOptions = textFormatOptions;
      this.textStyleOptions = textStyleOptions;
      this.listsOptions = listsOptions;
    });
  }

  ngOnDestroy() {
    this.editorSelectionService.destroy();
  }

  // ──────────────────────── editor event handlers ───────────────────────

  /**
   * Scenario 1 — If the editor contains only bare text nodes (no block
   * wrapper), wrap everything inside a `<p>`.
   */
  protected onEditorInput() {
    const editorEl = this.editor()?.nativeElement as HTMLElement;
    if (!editorEl) return;

    // Nothing to do when editor is empty
    if (!editorEl.innerHTML.trim()) return;

    // Check whether every direct child is already a block element
    const hasOnlyBlocks = Array.from(editorEl.childNodes).every(
      (child) =>
        child instanceof HTMLElement &&
        /^(P|H[1-6]|DIV|UL|OL|BLOCKQUOTE|PRE|TABLE|HR)$/i.test(child.tagName),
    );

    if (!hasOnlyBlocks) {
      this.wrapBareContentInParagraph(editorEl);
    }

    this.emitValue();
  }

  /**
   * Scenario 3 — Enter key creates a new `<p><br></p>`.
   * Shift+Enter is left as default (inserts `<br>` inside current block).
   */
  protected onEditorKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();

    const ctx = this.editorSelectionService.getSelectionAndRange();
    if (!ctx) return;

    const { selection, range } = ctx;
    const editorEl = this.editor()?.nativeElement as HTMLElement;

    // Split current content at cursor — delete any selected text first
    range.deleteContents();

    // Create the new paragraph
    const newP = document.createElement('p');
    newP.innerHTML = '<br>';

    // Find the current block element the cursor lives in
    const currentBlock = this.editorSelectionService.findBlockElement(range.startContainer);

    if (currentBlock && editorEl.contains(currentBlock)) {
      // If the cursor is in the middle of a block, move trailing content
      // into the new paragraph
      const trailingRange = document.createRange();
      trailingRange.setStart(range.startContainer, range.startOffset);
      trailingRange.setEnd(currentBlock, currentBlock.childNodes.length);
      const trailingContent = trailingRange.extractContents();

      // Only use trailing content if it has real content
      if (trailingContent.textContent?.trim() || trailingContent.querySelector('*')) {
        newP.innerHTML = '';
        newP.appendChild(trailingContent);
      }

      // Ensure the current block still has content
      if (!currentBlock.innerHTML.trim()) {
        currentBlock.innerHTML = '<br>';
      }

      // Insert new <p> after the current block
      currentBlock.after(newP);
    } else {
      // No block parent — just append to editor
      editorEl.appendChild(newP);
    }

    // Place cursor at the start of the new paragraph
    const newRange = document.createRange();
    newRange.setStart(newP, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    this.editorSelectionService.saveSelection();
    this.emitValue();
  }

  // ──────────────────────── toolbar handlers ────────────────────────────

  /**
   * Scenario 2 — We save the selection *before* focus leaves the editor
   * (the overlay steals focus). The formatting methods call
   * `getSelectionAndRange()` which restores it automatically.
   */

  protected onTextFormatClick(elementRef: Element) {
    this.editorSelectionService.saveSelection();

    const optionListsConfig = {
      optionLists: this.textFormatOptions,
      handleOptionEvent: (option: any) => {
        this.applyBlockFormat(option.id);
        this.editorSelectionService.normalizeBlocks();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onTextStylesClick(elementRef: Element) {
    this.editorSelectionService.saveSelection();

    const optionListsConfig = {
      optionLists: this.textStyleOptions,
      handleOptionEvent: (option: any) => {
        this.toggleInline(option.id);
        this.editorSelectionService.normalizeInline();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onListClick(elementRef: Element) {
    this.editorSelectionService.saveSelection();

    const optionListsConfig = {
      optionLists: this.listsOptions,
      handleOptionEvent: (option: any) => {
        this.applyBulletedList(option.id);
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(elementRef),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected showColorPicker(elementRef: Element) {
    this.editorSelectionService.saveSelection();

    const ref = this.colorPickerTemplate;
    if (!ref()) return;

    this.overlayService.open({
      template: ref!(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(elementRef),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected showMultiMediaUpload(elementRef: Element) {
    this.editorSelectionService.saveSelection();

    const ref = this.uploadMultiMediaTemplate;
    if (!ref()) return;

    const overlayRef = this.overlayService.open({
      template: ref!(),
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(elementRef),
      positions: [FLOAT_TOP_POSITION, FLOAT_BOTTOM_POSITION],
      beforeCloseCallback: () => {
        this.closeOverlay();
      },
    });

    overlayRef._outsidePointerEvents.subscribe((mouseEvent: MouseEvent) => {
      console.log(mouseEvent);
      this.closeOverlay();
    });
  }

  // ──────────────────────── formatting logic ────────────────────────────

  private applyBlockFormat(tag: string) {
    const ctx = this.editorSelectionService.getSelectionAndRange();
    if (!ctx) return;

    const { selection, range } = ctx;
    const block = this.editorSelectionService.findBlockElement(range.startContainer);
    const newBlock = document.createElement(tag);

    if (!block) {
      newBlock.appendChild(range.startContainer);
      range.deleteContents();
      range.insertNode(newBlock);
    } else {
      if (block.tagName === tag.toUpperCase()) return;
      newBlock.innerHTML = block.innerHTML;
      block.replaceWith(newBlock);
    }

    // Restore cursor at end of new block
    range.selectNodeContents(newBlock);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    this.editorSelectionService.saveSelection();
    this.emitValue();
  }

  private toggleInline(tag: string) {
    const ctx = this.editorSelectionService.getSelectionAndRange();
    if (!ctx) return;

    const { selection, range } = ctx;
    if (range.collapsed) return;

    const startAncestor = this.editorSelectionService.findAncestor(range.startContainer, tag);
    const endAncestor = this.editorSelectionService.findAncestor(range.endContainer, tag);

    // Fully inside same formatting → UNWRAP
    if (startAncestor && startAncestor === endAncestor) {
      this.unwrapElement(startAncestor);
      return;
    }

    // Otherwise → APPLY
    this.applyInline(tag, range, selection);
  }

  private applyInline(tag: string, range: Range, selection: Selection) {
    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    range.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(range);

    this.editorSelectionService.saveSelection();
    this.emitValue();
  }

  private unwrapElement(element: HTMLElement) {
    const parent = element.parentNode;
    if (!parent) return;

    const contents = document.createDocumentFragment();
    while (element.firstChild) {
      contents.appendChild(element.firstChild);
    }
    parent.replaceChild(contents, element);
    this.emitValue();
  }

  private applyBulletedList(tag: string) {
    const ctx = this.editorSelectionService.getSelectionAndRange();
    if (!ctx) return;

    const { selection, range } = ctx;
    const block = this.editorSelectionService.findBlockElement(range.startContainer);
    const newListBlock = document.createElement(tag);
    const listItem = document.createElement('li');

    if (!block) {
      newListBlock.appendChild(listItem);
      listItem.appendChild(range.startContainer);
      range.deleteContents();
      range.insertNode(newListBlock);
    } else {
      if (block.tagName === tag.toUpperCase()) return;
      listItem.innerHTML = block.innerHTML;
      newListBlock.appendChild(listItem);
      block.replaceWith(newListBlock);
    }

    range.selectNodeContents(newListBlock);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    this.editorSelectionService.saveSelection();
    this.emitValue();
  }

  // ──────────────────── color formatting ─────────────────────────────────

  /**
   * Called when a colour swatch is clicked.  If the selection already has the
   * same colour applied (via a wrapping <span>), the colour is toggled off
   * by splitting the span.  Otherwise the selection is wrapped in a new
   * coloured <span>.
   */
  protected onColorSelect(colorHexCode: string) {
    const ctx = this.editorSelectionService.getSelectionAndRange();
    if (!ctx) return;

    const { selection, range } = ctx;
    if (range.collapsed) return;

    const color = '#' + colorHexCode;

    // Check if both ends of the selection live inside a <span> with the
    // same colour — if so, toggle it off.
    const startColored = this.editorSelectionService.findAncestorWithStyle(
      range.startContainer,
      'color',
      color,
    );
    const endColored = this.editorSelectionService.findAncestorWithStyle(
      range.endContainer,
      'color',
      color,
    );

    if (startColored && startColored === endColored) {
      // Toggle OFF — split the coloured span around the selection
      this.splitColoredElement(startColored, range, selection);
    } else {
      // Apply — wrap selection in a coloured <span>
      this.applyColor(color, range, selection);
    }

    this.emitValue();
  }

  private applyColor(color: string, range: Range, selection: Selection) {
    const span = document.createElement('span');
    span.style.color = color;
    span.appendChild(range.extractContents());
    range.insertNode(span);

    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
    this.editorSelectionService.saveSelection();
  }

  /**
   * Splits a coloured ancestor <span> so that the *selected* portion loses
   * its colour while the surrounding text keeps it.
   *
   * Before:  <span style="color:#f00">AAA [BBB] CCC</span>
   * After:   <span style="color:#f00">AAA </span>BBB<span style="color:#f00"> CCC</span>
   */
  private splitColoredElement(ancestor: HTMLElement, range: Range, selection: Selection) {
    const parent = ancestor.parentNode;
    if (!parent) return;

    // Grab a reference node *before* we start mutating the DOM
    const insertionRef = ancestor.nextSibling;

    // 1. Extract content AFTER the selection (do this first to avoid
    //    offset drift)
    const afterRange = document.createRange();
    afterRange.setStart(range.endContainer, range.endOffset);
    afterRange.setEnd(ancestor, ancestor.childNodes.length);
    const afterContent = afterRange.extractContents();

    // 2. Extract the selected content itself (will lose its colour wrapper)
    const selectedContent = range.extractContents();

    // 3. Whatever remains inside `ancestor` is the "before" content.
    //    Remove the ancestor entirely if it's now empty.
    const hasBeforeContent = ancestor.textContent?.trim() || ancestor.querySelector('*');
    if (!hasBeforeContent) {
      parent.removeChild(ancestor);
    }

    // 4. Insert selected content (un-coloured) after the ancestor
    parent.insertBefore(selectedContent, insertionRef);

    // 5. Insert an "after" coloured span if there was trailing content
    const hasAfterContent = afterContent.textContent?.trim() || afterContent.querySelector('*');
    if (hasAfterContent) {
      const afterSpan = ancestor.cloneNode(false) as HTMLElement;
      afterSpan.appendChild(afterContent);
      parent.insertBefore(afterSpan, insertionRef);
    }

    this.editorSelectionService.saveSelection();
  }

  // ──────────────────── helper: wrap bare text in <p> ───────────────────

  private wrapBareContentInParagraph(editorEl: HTMLElement) {
    // Save current cursor position relative information
    const sel = this.editorSelectionService.getSelection();
    const cursorOffset = sel?.focusOffset ?? 0;

    const p = document.createElement('p');

    // Move all child nodes into the <p>
    while (editorEl.firstChild) {
      p.appendChild(editorEl.firstChild);
    }
    editorEl.appendChild(p);

    // Restore cursor to end of the paragraph
    const newRange = document.createRange();
    if (p.lastChild) {
      newRange.setStart(p.lastChild, Math.min(cursorOffset, p.lastChild.textContent?.length ?? 0));
      newRange.collapse(true);
    } else {
      newRange.setStart(p, 0);
      newRange.collapse(true);
    }

    sel?.removeAllRanges();
    sel?.addRange(newRange);
    this.editorSelectionService.saveSelection();
  }

  // ──────────────────────────── misc ─────────────────────────────────────

  private emitValue() {
    const html = this.editor()?.nativeElement.innerHTML;
    this.valueChange.emit(html);
  }

  protected onUploadFileClick() {
    const inputEle = document.createElement('input');
    inputEle.type = 'file';
    inputEle.accept = 'image/*';
    inputEle.click();
    if (inputEle.onchange) return;
    inputEle.onchange = this.onUploadingFile.bind(this, inputEle);
  }

  private async onUploadingFile(inputEle: HTMLInputElement) {
    const file = inputEle.files?.[0];
    if (!file) return;

    // 1. Validate the uploaded file
    const validation = this.editorImageService.validateImageFile(file);
    if (!validation.valid) {
      console.error('[WYSIWYG] Image validation failed:', validation.error);
      alert(validation.error);
      inputEle.remove();
      return;
    }

    // 2. Read file as data-URL
    try {
      const dataUrl = await this.editorImageService.readFileAsDataUrl(file);

      // 3. Insert <img> at saved cursor position / replace selection
      const imgHtml = `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;height:auto;" />`;
      this.editorSelectionService.insertHTML(imgHtml);
      this.emitValue();
      this.closeOverlay();
    } catch (err) {
      console.error('[WYSIWYG] Failed to read image:', err);
      alert('Failed to read the image file. Please try again.');
    }

    //destroying temporarily created input element
    inputEle.remove();
  }

  private inputLinkEffect = effect(() => {
    this.editorImageService.isValidPreviewLink(this.imgPreviewLink());
  });

  protected onPreviewBtnClick() {
    this.editorImageService.loadImage(this.imgPreviewLink());
  }

  protected onInsertUrlImage() {
    const imgHtml = `<img src="${this.imgPreviewLink()}" alt="${this.imgPreviewLink()}" style="max-width:100%;height:auto;" />`;
    this.editorSelectionService.insertHTML(imgHtml);
    this.emitValue();
    this.closeOverlay();
  }

  protected closeOverlay() {
    this.overlayService.close();
    this.imgPreviewLink.set('');
    this.editorImageService.resetUploadImageLinkState();
    this.editorImageService.closeCamera();
  }

  protected onCaptureClick(videoElement: HTMLVideoElement) {
    this.editorImageService
      .onCaptureClick(videoElement)
      .then((dataUrl) => {
        if (!dataUrl) return;
        const imgHtml = `<img src="${dataUrl}" alt="${dataUrl}" style="max-width:100%;height:auto;" />`;
        this.editorSelectionService.insertHTML(imgHtml);
        this.emitValue();
        this.closeOverlay();
      })
      .catch((err) => {
        console.error('[WYSIWYG] Failed to capture image:', err);
        alert('Failed to capture the image. Please try again.');
      });
  }

  protected onCaptureCancelClick() {
    this.editorImageService.closeCamera();
  }
}
