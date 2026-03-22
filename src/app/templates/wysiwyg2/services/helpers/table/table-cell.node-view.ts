import { Node } from 'prosemirror-model';
import { CellSelection } from 'prosemirror-tables';
import { EditorView } from 'prosemirror-view';

export function tableCellNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  return buildCellNodeView(node, view, getPos, 'td');
}
export function tableHeaderNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  return buildCellNodeView(node, view, getPos, 'th');
}

function buildCellNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
  tag: 'td' | 'th',
) {
  const nodeType = node.type;
  const isHeader = tag === 'th';

  const cell = document.createElement(tag);
  cell.style.cssText = `
    border: 1px solid #DFE1E6;
    padding: 8px;
    vertical-align: top;
    position: relative;
    min-width: 48px;
    box-sizing: border-box;
    overflow: visible;
    background-color: ${
      node.attrs['background'] || (isHeader ? '#F1F2F4' : 'transparent')
    };
  `;

  if (node.attrs['colspan'] > 1) cell.colSpan = node.attrs['colspan'];
  if (node.attrs['rowspan'] > 1) cell.rowSpan = node.attrs['rowspan'];

  // ── Column bump (appears on top border of cell on hover) ──
  const colBump = document.createElement('div');
  colBump.contentEditable = 'false';
  colBump.style.cssText = `
    display: none;
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 8px;
    background: #C1C7D0;
    border-radius: 4px;
    cursor: pointer;
    z-index: 20;
    pointer-events: auto;
    transition: background 0.15s;
  `;
  cell.appendChild(colBump);

  // ── Row bump (appears on left border of cell on hover) ────
  const rowBump = document.createElement('div');
  rowBump.contentEditable = 'false';
  rowBump.style.cssText = `
    display: none;
    position: absolute;
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 24px;
    background: #C1C7D0;
    border-radius: 4px;
    cursor: pointer;
    z-index: 20;
    pointer-events: auto;
    transition: background 0.15s;
  `;
  cell.appendChild(rowBump);

  // ── IMPORTANT: separate content wrapper so ProseMirror doesn't clobber the bumps ──
  // If contentDOM === dom (the cell itself), ProseMirror owns ALL children of the
  // cell and will strip the bump divs on every update. We give it a dedicated
  // inner div instead.
  const contentDOM = document.createElement('div');
  contentDOM.style.cssText = 'min-height: 1em; outline: none;';
  cell.appendChild(contentDOM);

  // ── Show/hide bumps on cell hover ──────────────────────────
  cell.addEventListener('mouseenter', () => {
    colBump.style.display = 'block';
    rowBump.style.display = 'block';
  });
  cell.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === colBump || e.relatedTarget === rowBump) return;
    colBump.style.display = 'none';
    rowBump.style.display = 'none';
  });

  colBump.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === cell) return;
    colBump.style.display = 'none';
    rowBump.style.display = 'none';
  });

  rowBump.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === cell) return;
    colBump.style.display = 'none';
    rowBump.style.display = 'none';
  });

  colBump.addEventListener('mouseenter', () => {
    colBump.style.background = '#0052CC';
  });
  colBump.addEventListener('mouseleave', () => {
    colBump.style.background = '#C1C7D0';
  });

  rowBump.addEventListener('mouseenter', () => {
    rowBump.style.background = '#0052CC';
  });
  rowBump.addEventListener('mouseleave', () => {
    rowBump.style.background = '#C1C7D0';
  });

  // ── Col bump click → select entire column ─────────────────
  colBump.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = getPos();
    if (pos == null) return;

    const { doc } = view.state;
    const $pos = doc.resolve(pos);

    let tableDepth = -1;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.spec['tableRole'] === 'table') {
        tableDepth = d;
        break;
      }
    }
    if (tableDepth === -1) return;

    const tableNode = $pos.node(tableDepth);
    const tableStart = $pos.start(tableDepth);

    // Count siblings before this cell to find colIndex
    const rowNode = $pos.node(tableDepth + 1);
    const rowStart = $pos.before(tableDepth + 1);
    let colIndex = 0;
    rowNode.forEach((_, offset) => {
      if (rowStart + 1 + offset < pos) colIndex++;
    });

    try {
      // First cell in column (row 0, colIndex)
      const firstRow = tableNode.child(0);
      let firstCellPos = tableStart + 1;
      for (let c = 0; c < colIndex; c++) {
        firstCellPos += firstRow.child(c).nodeSize;
      }

      // Last cell in column (last row, colIndex)
      const lastRow = tableNode.child(tableNode.childCount - 1);
      let lastRowStart = tableStart + 1;
      for (let r = 0; r < tableNode.childCount - 1; r++) {
        lastRowStart += tableNode.child(r).nodeSize;
      }
      let lastCellPos = lastRowStart + 1;
      for (let c = 0; c < colIndex; c++) {
        lastCellPos += lastRow.child(c).nodeSize;
      }

      const sel = CellSelection.create(doc, firstCellPos, lastCellPos);
      view.dispatch(view.state.tr.setSelection(sel));
      view.focus();
    } catch (_) {}
  });

  // ── Row bump click → select entire row ────────────────────
  rowBump.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = getPos();
    if (pos == null) return;

    const { doc } = view.state;
    const $pos = doc.resolve(pos);

    let tableDepth = -1;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.spec['tableRole'] === 'table') {
        tableDepth = d;
        break;
      }
    }
    if (tableDepth === -1) return;

    const tableNode = $pos.node(tableDepth);
    const tableStart = $pos.start(tableDepth);

    // Find which row this cell is in
    let rowIndex = 0;
    let rowStart = tableStart + 1;
    for (let r = 0; r < tableNode.childCount; r++) {
      const rowEnd = rowStart + tableNode.child(r).nodeSize;
      if (pos >= rowStart && pos < rowEnd) {
        rowIndex = r;
        break;
      }
      rowStart = rowEnd;
    }

    try {
      let rStart = tableStart + 1;
      for (let r = 0; r < rowIndex; r++) rStart += tableNode.child(r).nodeSize;
      const firstCellPos = rStart + 1;

      const rowNode = tableNode.child(rowIndex);
      let lastCellPos = rStart + 1;
      for (let c = 0; c < rowNode.childCount - 1; c++) {
        lastCellPos += rowNode.child(c).nodeSize;
      }

      const sel = CellSelection.create(doc, firstCellPos, lastCellPos);
      view.dispatch(view.state.tr.setSelection(sel));
      view.focus();
    } catch (_) {}
  });

  return {
    dom: cell,
    contentDOM: contentDOM, // ← key fix: NOT `cell` itself
    update(updatedNode: Node) {
      if (updatedNode.type !== nodeType) return false;
      const bg = updatedNode.attrs['background'];
      cell.style.backgroundColor = bg || (isHeader ? '#F1F2F4' : 'transparent');
      return true;
    },
  };
}