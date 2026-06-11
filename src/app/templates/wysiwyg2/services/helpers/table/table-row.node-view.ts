import { Node as PMNode } from 'prosemirror-model';
import { EditorView, ViewMutationRecord } from 'prosemirror-view';

export function tableRowNodeView(node: PMNode, view: EditorView, getPos: () => number | undefined) {
  const nodeType = node.type;
  let currentHeight: number = node.attrs['height'] || 0;

  const tr = document.createElement('tr');
  // Set initial styles via individual properties — never overwrite cssText
  // from a handler (prevents PM MutationObserver → update → mutation loop).
  tr.style.position = 'relative';
  tr.style.boxSizing = 'border-box';
  tr.style.minHeight = (currentHeight || 32) + 'px';

  // ── Row resize handle (bottom-border drag) ─────────────────
  // Row drag-handle buttons are now rendered by the controls plugin
  // inside .pm-table-drag-row-controls. This handle is only for
  // bottom-border height resizing.
  const rowHandle = document.createElement('div');
  rowHandle.contentEditable = 'false';
  rowHandle.style.cssText = `
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: row-resize;
    z-index: 5;
  `;

  const rowHandleBar = document.createElement('div');
  rowHandleBar.style.cssText = `
    position: absolute;
    bottom: 2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: transparent;
    border-radius: 1px;
    transition: background 0.15s;
  `;
  rowHandle.appendChild(rowHandleBar);
  tr.appendChild(rowHandle);

  rowHandle.addEventListener('mouseenter', () => {
    rowHandleBar.style.background = '#0052CC';
  });
  rowHandle.addEventListener('mouseleave', () => {
    rowHandleBar.style.background = 'transparent';
  });

  // ── Resize implementation ──────────────────────────────────
  rowHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = tr.offsetHeight;

    const onMove = (e: MouseEvent) => {
      const newHeight = Math.max(32, startHeight + e.clientY - startY);
      tr.style.minHeight = newHeight + 'px';
      currentHeight = newHeight;
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      const pos = getPos();
      if (pos == null) return;
      const rowNode = view.state.doc.nodeAt(pos);
      if (!rowNode) return;

      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...rowNode.attrs,
          height: currentHeight,
        }),
      );
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  return {
    dom: tr,
    contentDOM: tr, // cells go directly into tr
    ignoreMutation(mutation: ViewMutationRecord) {
      const target = mutation.target as Node;
      // Ignore mutations inside the resize handle
      if (target === rowHandle || rowHandle.contains(target as HTMLElement)) {
        return true;
      }
      // Ignore attribute/style mutations on tr itself (our minHeight writes)
      if (mutation.type === 'attributes' && target === tr) {
        return true;
      }
      return false;
    },
    update(updatedNode: PMNode) {
      if (updatedNode.type !== nodeType) return false;
      const newHeight = updatedNode.attrs['height'] || 0;
      if (newHeight !== currentHeight) {
        currentHeight = newHeight;
        tr.style.minHeight = (newHeight || 32) + 'px';
      }
      return true;
    },
  };
}
