import { Node as PMNode } from 'prosemirror-model';
import { EditorView, ViewMutationRecord } from 'prosemirror-view';

export function tableRowNodeView(
  node: PMNode,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;
  let currentHeight: number = node.attrs['height'] || 0;

  const tr = document.createElement('tr');
  // ✅ Set initial styles ONCE and never overwrite cssText again —
  //    overwriting cssText from a mousemove handler triggers PM's
  //    MutationObserver on every frame, creating a mutation → update → mutation loop.
  tr.style.position = 'relative';
  tr.style.boxSizing = 'border-box';
  tr.style.minHeight = (currentHeight || 32) + 'px';

  // ── Row resize handle (bottom border drag) ─────────────────
  // Appended AFTER contentDOM children — PM only manages children
  // that map to document nodes, and ignoreMutation() below tells PM
  // to ignore this element entirely.
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

  // ── Single resize implementation (via rowHandle only) ──────
  // ✅ Removed the duplicate mousemove+mousedown on tr —
  //    that approach wrote cssText on every mousemove frame which
  //    triggered PM's MutationObserver → PM update() → minHeight write
  //    → another mutation → continuous loop at 60fps.
  rowHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = tr.offsetHeight;

    const onMove = (e: MouseEvent) => {
      const newHeight = Math.max(32, startHeight + e.clientY - startY);
      // ✅ Only modify the specific property, never cssText
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
      // ✅ Tell PM to ignore:
      // 1. Any mutation inside the resize handle (it's not part of the document)
      // 2. Attribute/style mutations on tr itself (our minHeight writes above)
      //    Without this, every tr.style.minHeight = '...' write triggers a PM
      //    re-sync which writes minHeight again → infinite loop.
      const target = mutation.target as Node;
      if (target === rowHandle || rowHandle.contains(target as HTMLElement)) {
        return true;
      }
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
        // ✅ Property write, not cssText — ignoreMutation above suppresses the
        //    resulting attribute mutation so PM doesn't re-enter update().
        tr.style.minHeight = (newHeight || 32) + 'px';
      }
      return true;
    },
  };
}