import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { EditorExpandTitleComponent } from '../../components';
import { MountFn } from '../editor-view.service';

export function expandNodeView(
  mountFn: MountFn,
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  let isExpanded = node.attrs['expanded'] !== false;
  let currentTitle = node.attrs['title'] || '';

  // ── Mount Angular component ────────────────────────────────
  const { element, ref } = mountFn(EditorExpandTitleComponent, {
    title: currentTitle,
    expanded: isExpanded,
    onToggle: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isExpanded = !isExpanded;
      ref.setInput('expanded', isExpanded);
      ref.changeDetectorRef.detectChanges();
      const pos = getPos();
      if (pos == null) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...view.state.doc.nodeAt(pos)?.attrs,
          expanded: isExpanded,
        }),
      );
    },
    onTitleChange: (title: string) => {
      currentTitle = title;
      const pos = getPos();
      if (pos == null) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...view.state.doc.nodeAt(pos)?.attrs,
          title: currentTitle,
        }),
      );
    },
  });

  // ── contentDOM is the slot inside the Angular component ────
  const contentDOM = ref.instance.contentSlot()?.nativeElement;

  return {
    dom: element,
    contentDOM, // ProseMirror renders child nodes here
    update(updatedNode: Node) {
      if (updatedNode.type !== node.type) return false;

      const newExpanded = updatedNode.attrs['expanded'] !== false;
      if (newExpanded !== isExpanded) {
        isExpanded = newExpanded;
        ref.setInput('expanded', isExpanded);
      }

      const newTitle = updatedNode.attrs['title'] || '';
      if (newTitle !== currentTitle) {
        currentTitle = newTitle;
        ref.setInput('title', currentTitle);
      }

      ref.changeDetectorRef.detectChanges();
      return true;
    },
    destroy() {
      // ── Cleanup Angular component on node removal ──────────
      ref.destroy();
    },
  };
}
/**
 * ## Why this works for all content types
 * expand (outer div — Angular component)
 * ├── title-container  [contenteditable="false"]  ← Angular owns this
 * └── content-wrapper  [display:none/block]       ← Angular controls collapse
 *    └── contentSlot  (div)                      ← ProseMirror owns this
 *        ├── paragraph
 *        ├── task_list → task_item → paragraph
 *        ├── bullet_list → list_item → paragraph
 *        ├── ordered_list → list_item → paragraph
 *        ├── code_block
 *        └── mediaSingle → media (images)
 */
