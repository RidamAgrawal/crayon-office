import { EditorPanelComponent, PanelType } from '../../components';
import { MountFn } from '../editor-view.service';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';

export function panelNodeView(
  mountFn: MountFn,
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  let currentType: PanelType = node.attrs['panelType'] || 'info';

  const { element, ref } = mountFn(EditorPanelComponent, {
    panelType: currentType,
    onTypeChange: (type: PanelType) => {
      currentType = type;
      ref.setInput('panelType', currentType);
      ref.changeDetectorRef.detectChanges();
      const pos = getPos();
      if (pos == null) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...view.state.doc.nodeAt(pos)?.attrs,
          panelType: currentType,
        }),
      );
    },
    onDelete: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos();
      if (pos == null) return;
      const nodeSize = view.state.doc.nodeAt(pos)?.nodeSize ?? 0;
      view.dispatch(view.state.tr.delete(pos, pos + nodeSize));
    },
    onCopy: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos();
      if (pos == null) return;
      const nodeAt = view.state.doc.nodeAt(pos);
      if (!nodeAt) return;
      view.dispatch(view.state.tr.insert(pos + nodeAt.nodeSize, nodeAt));
    },
  } as any);

  const contentDOM = ref.instance.contentSlot()?.nativeElement;

  return {
    dom: element,
    contentDOM,
    update(updatedNode: Node) {
      if (updatedNode.type !== node.type) return false;

      const newType = updatedNode.attrs['panelType'] || 'info';
      if (newType !== currentType) {
        currentType = newType;
        ref.setInput('panelType', currentType);
      }
      const isEmpty = updatedNode.textContent.trim() === '';
      ref.instance.isEmpty.set(isEmpty);

      ref.changeDetectorRef.detectChanges();
      return true;
    },
    destroy() {
      ref.destroy();
    },
  };
}
