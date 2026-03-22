import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export function horizontalRuleNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;

  const outer = document.createElement('div');
  outer.setAttribute('data-prosemirror-content-type', 'node');
  outer.setAttribute('data-prosemirror-node-name', 'horizontal_rule');
  outer.setAttribute('data-prosemirror-node-block', 'true');
  outer.contentEditable = 'false';
  outer.style.cssText = `
    padding: 8px 0;
    cursor: pointer;
    position: relative;
    user-select: none;
  `;

  const hr = document.createElement('hr');
  hr.style.cssText = `
    border: none;
    border-top: 2px solid #091E4224;
    margin: 0;
  `;
  outer.appendChild(hr);

  // ── Toolbar ────────────────────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.contentEditable = 'false';
  toolbar.style.cssText = `
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
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
      background: none; border: none; padding: 4px 6px;
      cursor: pointer; border-radius: 3px;
      display: flex; align-items: center; justify-content: center;
    `;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">${svgInner}</svg>`;
    btn.addEventListener(
      'mouseenter',
      () => (btn.style.background = '#F1F2F4'),
    );
    btn.addEventListener('mouseleave', () => (btn.style.background = 'none'));
    return btn;
  };

  const deleteBtn = makeTbBtn(
    'Delete',
    `
    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"
      stroke="#44546F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  );

  toolbar.appendChild(deleteBtn);

  // ── Events ─────────────────────────────────────────────────
  outer.addEventListener('mouseenter', () => {
    toolbar.style.display = 'flex';
    hr.style.borderColor = '#0052CC';
  });
  outer.addEventListener('mouseleave', () => {
    toolbar.style.display = 'none';
    hr.style.borderColor = '#091E4224';
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
    // ✅ No contentDOM — leaf node, ProseMirror renders nothing inside
    update(updatedNode: Node) {
      return updatedNode.type === nodeType;
    },
  };
}

/**
 * horizontal_rule (outer — no contentDOM)
 * └── hr (rendered directly by nodeView)
 */
