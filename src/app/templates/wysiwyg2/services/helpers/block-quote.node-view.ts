import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export function blockquoteNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;

  // ── Outer wrapper ──────────────────────────────────────────
  const outer = document.createElement('blockquote');
  outer.setAttribute('data-prosemirror-content-type', 'node');
  outer.setAttribute('data-prosemirror-node-name', 'blockquote');
  outer.setAttribute('data-prosemirror-node-block', 'true');
  outer.style.cssText = `
    margin: 8px 0;
    padding: 8px 0 8px 16px;
    border-left: 3px solid #091E4224;
    box-sizing: border-box;
    position: relative;
  `;

  // ── contentDOM — ProseMirror renders children here ─────────
  const contentDOM = document.createElement('div');
  contentDOM.style.cssText = `
    color: #172B4D;
    font-style: normal;
  `;
  outer.appendChild(contentDOM);

  // ── Toolbar (shown on hover) ───────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.contentEditable = 'false';
  toolbar.style.cssText = `
    display: none;
    position: absolute;
    bottom: -36px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFFFFF;
    border: 1px solid #DFE1E6;
    border-radius: 4px;
    padding: 4px;
    gap: 4px;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    z-index: 10;
  `;
  outer.appendChild(toolbar);

  const makeTbBtn = (title: string, svgInner: string) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.style.cssText = `
      background: none;
      border: none;
      padding: 4px 6px;
      cursor: pointer;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        ${svgInner}
      </svg>
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#F1F2F4';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'none';
    });
    return btn;
  };

  const copyBtn = makeTbBtn(
    'Duplicate',
    `<rect x="5" y="5" width="8" height="9" rx="1" stroke="#44546F" stroke-width="1.5"/>
     <path d="M3 11V3a1 1 0 0 1 1-1h7" stroke="#44546F" stroke-width="1.5" stroke-linecap="round"/>`,
  );

  const deleteBtn = makeTbBtn(
    'Delete',
    `<path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"
       stroke="#44546F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  );

  toolbar.appendChild(copyBtn);
  toolbar.appendChild(deleteBtn);

  // ── Events ─────────────────────────────────────────────────
  outer.addEventListener('mouseenter', () => {
    toolbar.style.display = 'flex';
  });
  outer.addEventListener('mouseleave', (e) => {
    if (!toolbar.contains(e.relatedTarget as HTMLElement)) {
      toolbar.style.display = 'none';
    }
  });
  toolbar.addEventListener('mouseleave', (e) => {
    if (!outer.contains(e.relatedTarget as HTMLElement)) {
      toolbar.style.display = 'none';
    }
  });

  copyBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos();
    if (pos == null) return;
    const n = view.state.doc.nodeAt(pos);
    if (!n) return;
    view.dispatch(view.state.tr.insert(pos + n.nodeSize, n));
  });

  deleteBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos();
    if (pos == null) return;
    const n = view.state.doc.nodeAt(pos);
    if (!n) return;
    view.dispatch(view.state.tr.delete(pos, pos + n.nodeSize));
  });

  return {
    dom: outer,
    contentDOM,
    update(updatedNode: Node) {
      if (updatedNode.type !== nodeType) return false;
      return true;
    },
  };
}
/**
 * blockquote (outer — left border)
 * └── contentDOM (div)       ← ProseMirror renders here
 *     ├── paragraph
 *     ├── bullet_list
 *     ├── ordered_list
 *     └── code_block
 */
