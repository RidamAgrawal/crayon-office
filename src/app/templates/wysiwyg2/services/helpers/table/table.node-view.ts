import { Node } from 'prosemirror-model';
import { EditorView, ViewMutationRecord } from 'prosemirror-view';

export function tableNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative;
    margin: 8px 0;
  `;

  const table = document.createElement('table');
  table.style.cssText = `
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
    box-sizing: border-box;
    overflow-x: auto;
    display: block;
  `;
  wrapper.appendChild(table);

  // ── Right edge resize handle ───────────────────────────────
  const resizeHandle = document.createElement('div');
  resizeHandle.contentEditable = 'false';
  resizeHandle.style.cssText = `
    position: absolute;
    top: 0; right: -4px;
    width: 8px; height: 100%;
    cursor: col-resize; z-index: 10;
  `;
  const resizeBar = document.createElement('div');
  resizeBar.style.cssText = `
    width: 3px; height: 100%;
    background: transparent; border-radius: 2px;
    transition: background 0.15s;
    margin: 0 auto;
  `;
  resizeHandle.appendChild(resizeBar);
  wrapper.appendChild(resizeHandle);

  resizeHandle.addEventListener('mouseenter', () => {
    resizeBar.style.background = '#0052CC';
  });
  resizeHandle.addEventListener('mouseleave', () => {
    resizeBar.style.background = 'transparent';
  });

  let startX = 0;
  let startWidth = 0;
  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    startWidth = table.offsetWidth;

    const onMove = (e: MouseEvent) => {
      table.style.width = Math.max(100, startWidth + e.clientX - startX) + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // ── Toolbar ────────────────────────────────────────────────
  const toolbar = buildTableToolbar(view, getPos);
  wrapper.appendChild(toolbar);

  // ✅ focusin/focusout only — avoids mouseenter/mouseleave which fire
  //    continuously during mouse movement causing unnecessary reflows.
  //    Use a small delay on focusout so clicking toolbar buttons (which
  //    momentarily blur the editor) doesn't hide the toolbar prematurely.
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  wrapper.addEventListener('focusin', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    toolbar.style.display = 'flex';
  });

  wrapper.addEventListener('focusout', (e) => {
    if (wrapper.contains(e.relatedTarget as HTMLElement)) return;
    // Short delay: toolbar buttons use mousedown (e.preventDefault) so focus
    // never actually leaves, but keep the guard for safety.
    hideTimer = setTimeout(() => {
      toolbar.style.display = 'none';
      hideTimer = null;
    }, 100);
  });

  return {
    dom: wrapper,
    contentDOM: table, // PM + prosemirror-tables renders directly into table
    update(updatedNode: Node) {
      return updatedNode.type === nodeType;
    },
    ignoreMutation(mutation: ViewMutationRecord) {
      const target = mutation.target as HTMLElement;

      // ✅ Ignore colgroup mutations added by the columnResizing() plugin
      if (
        mutation.target === table &&
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(
          (n) => (n as HTMLElement).tagName === 'COLGROUP',
        )
      ) {
        return true;
      }

      // ✅ Ignore mutations inside our non-contentDOM children (toolbar, resizeHandle)
      //    These live on `wrapper`, not inside `table` (contentDOM), but guard anyway.
      if (
        resizeHandle.contains(target) ||
        toolbar.contains(target) ||
        target === resizeHandle ||
        target === toolbar
      ) {
        return true;
      }

      // ✅ Ignore table-level style/width attribute mutations from our resize drag
      if (mutation.type === 'attributes' && mutation.target === table) {
        return true;
      }

      return false;
    },
  };
}

function buildTableToolbar(
  view: EditorView,
  getPos: () => number | undefined,
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
    // ✅ mousedown + preventDefault keeps editor focus so focusout doesn't fire
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

  toolbar.appendChild(makeBtn('⊞ Table options', () => {}));
  toolbar.appendChild(sep());
  toolbar.appendChild(makeBtn('↕ Row', () => {}));
  toolbar.appendChild(sep());
  toolbar.appendChild(makeBtn('⊞', () => {}));
  toolbar.appendChild(sep());

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