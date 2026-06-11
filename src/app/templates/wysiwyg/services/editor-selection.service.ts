/**
 * EditorSelectionService
 *
 * Centralises all selection management, range operations and DOM-walking
 * helpers for the WYSIWYG editor.  Instantiated as a plain class (not via
 * Angular DI) because it is tightly coupled to a specific editor element.
 */
export class EditorSelectionService {
  private savedRange: Range | null = null;
  private editorEl: HTMLElement | null = null;

  /** Listeners stored so we can remove them in destroy(). */
  private boundSave = () => this.saveSelection();

  // ────────────────────────────── lifecycle ──────────────────────────────

  /** Call once from ngAfterViewInit when the editor element is available. */
  setEditor(el: HTMLElement) {
    this.editorEl = el;
    this.startAutoSave();
  }

  /** Remove listeners – call from ngOnDestroy. */
  destroy() {
    if (!this.editorEl) return;
    this.editorEl.removeEventListener('mouseup', this.boundSave);
    this.editorEl.removeEventListener('keyup', this.boundSave);
    this.editorEl = null;
  }

  // ───────────────────────── selection helpers ───────────────────────────

  getSelection(): Selection | null {
    return window.getSelection();
  }

  /**
   * Returns the current live range if one exists, otherwise falls back to the
   * previously saved range.
   */
  getRange(): Range | null {
    const sel = this.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Only return the live range if the cursor is inside the editor
      if (this.editorEl?.contains(range.commonAncestorContainer)) {
        return range;
      }
    }
    return this.savedRange;
  }

  /**
   * Convenience – returns both selection and range, or `null` when neither
   * is available.  Eliminates the repeated 4-line null-check pattern.
   */
  getSelectionAndRange(): { selection: Selection; range: Range } | null {
    this.restoreSelection();
    const selection = this.getSelection();
    if (!selection || !selection.rangeCount) return null;
    return { selection, range: selection.getRangeAt(0) };
  }

  isInEditor(): boolean {
    const sel = this.getSelection();
    return !!(sel?.anchorNode && this.editorEl?.contains(sel.anchorNode));
  }

  saveSelection() {
    const sel = this.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Only save if the selection is inside the editor
      if (this.editorEl?.contains(range.commonAncestorContainer)) {
        this.savedRange = range.cloneRange();
      }
    }
  }

  restoreSelection() {
    if (this.savedRange) {
      const sel = this.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedRange);
    }
  }

  getSelectedText(): string {
    return this.getSelection()?.toString() ?? '';
  }

  isCollapsed(): boolean {
    return this.getSelection()?.isCollapsed ?? true;
  }

  // ───────────────────── DOM insertion helpers ───────────────────────────

  insertHTML(html: string) {
    this.restoreSelection();
    const range = this.getRange();
    if (!range) {
      const newRange = document.createRange();
      newRange.selectNodeContents(this.editorEl!);
      newRange.collapse(false);
      const fragment = newRange.createContextualFragment(html);
      newRange.insertNode(fragment);
      newRange.collapse(false);
      this.saveSelection();
    } else {
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      range.insertNode(fragment);
      range.collapse(false);
      this.saveSelection();
    }
  }

  insertText(text: string) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    this.insertHTML(escaped);
  }

  // ───────────────────── DOM walking helpers ─────────────────────────────

  /**
   * Walk up from `node` until we hit a block-level element
   * (P, H1-H6, DIV, LI) or the editor root.
   */
  findBlockElement(node: Node): HTMLElement | null {
    let current: Node | null = node;
    while (current && current !== this.editorEl) {
      if (current instanceof HTMLElement && /^(P|H[1-6]|DIV|LI)$/.test(current.tagName)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  /**
   * Walk up from `node` looking for an ancestor with the given tag name.
   */
  findAncestor(node: Node, tag: string): HTMLElement | null {
    let current: Node | null = node;
    while (current && current !== this.editorEl) {
      if (current instanceof HTMLElement && current.tagName === tag.toUpperCase()) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  /**
   * Walk up from `node` looking for a `<span>` whose inline style property
   * matches the given value.  Used for color toggle detection.
   */
  findAncestorWithStyle(node: Node, styleProp: string, styleValue: string): HTMLElement | null {
    let current: Node | null = node;
    while (current && current !== this.editorEl) {
      if (current instanceof HTMLElement && current.tagName === 'SPAN') {
        const inlineVal = current.style.getPropertyValue(styleProp);
        if (inlineVal && this.colorsMatch(inlineVal, styleValue)) {
          return current;
        }
      }
      current = current.parentNode;
    }
    return null;
  }

  /**
   * Loose colour comparison — normalises both values to lowercase trimmed
   * strings so `#FF0000` matches `#ff0000`.
   */
  private colorsMatch(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  // ──────────────────── normalisation helpers ────────────────────────────

  /**
   * Convert stray `<div>` wrappers into `<p>` elements.
   */
  normalizeBlocks() {
    this.editorEl?.querySelectorAll('div').forEach((div: HTMLDivElement) => {
      // Don't touch the editor element itself
      if (div === this.editorEl) return;
      const p = document.createElement('p');
      p.innerHTML = div.innerHTML || '<br>';
      div.replaceWith(p);
    });
  }

  /**
   * Merge adjacent inline elements with the same tag (e.g. two consecutive
   * `<strong>` blocks).
   */
  normalizeInline() {
    this.editorEl?.querySelectorAll('strong, em, u, s, code, sub, sup').forEach((el) => {
      const next = el.nextSibling;
      if (next instanceof HTMLElement && next.tagName === el.tagName) {
        el.innerHTML += next.innerHTML;
        next.remove();
      }
    });
  }

  // ────────────────────────── private ────────────────────────────────────

  /**
   * Listen to mouseup / keyup inside the editor so the saved range is
   * always up-to-date.
   */
  private startAutoSave() {
    if (!this.editorEl) return;
    this.editorEl.addEventListener('mouseup', this.boundSave);
    this.editorEl.addEventListener('keyup', this.boundSave);
  }
}
