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
  // Add Confluence-style class names
  cell.className = isHeader
    ? 'pm-table-header-content-wrap'
    : 'pm-table-cell-content-wrap';
  cell.style.cssText = `
    border: 1px solid #DFE1E6;
    padding: 8px;
    vertical-align: top;
    position: relative;
    min-width: 48px;
    box-sizing: border-box;
    overflow: visible;
    background-color: ${node.attrs['background'] || (isHeader ? '#F1F2F4' : 'transparent')};
    ${isHeader ? 'font-weight: 600;' : ''}
  `;

  if (node.attrs['colspan'] > 1) cell.colSpan = node.attrs['colspan'];
  if (node.attrs['rowspan'] > 1) cell.rowSpan = node.attrs['rowspan'];

  const svgNs = 'http://www.w3.org/2000/svg';

  // Helper: build a Confluence-style SVG pill (24×5, rx=3)
  function buildPillSvg(): { svg: SVGSVGElement; rect: SVGRectElement } {
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('xmlns', svgNs);
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '5');
    svg.setAttribute('fill', 'none');
    const rect = document.createElementNS(svgNs, 'rect');
    rect.classList.add('pm-table-drag-handle-minimised');
    rect.setAttribute('width', '24');
    rect.setAttribute('height', '5');
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', '#DFE1E6');
    svg.appendChild(rect);
    return { svg, rect };
  }

  // ── Column bump (appears on top border of first-row cell on hover) ──
  const colBump = document.createElement('div');
  colBump.contentEditable = 'false';
  colBump.style.cssText = `
    display: none;
    position: absolute;
    top: -13px;
    left: 50%;
    transform: translateX(-50%);
    cursor: grab;
    z-index: 20;
    pointer-events: auto;
  `;
  const colPill = buildPillSvg();
  const colRect = colPill.rect;
  const colSpan = document.createElement('span');
  colSpan.style.pointerEvents = 'none';
  colSpan.appendChild(colPill.svg);
  colBump.appendChild(colSpan);
  cell.appendChild(colBump);

  // ── Row bump (appears on left border of first-column cell on hover) ──
  const rowBump = document.createElement('div');
  rowBump.contentEditable = 'false';
  rowBump.style.cssText = `
    display: none;
    position: absolute;
    left: -13px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    cursor: grab;
    z-index: 20;
    pointer-events: auto;
  `;
  const rowPill = buildPillSvg();
  const rowRect = rowPill.rect;
  const rowSpan = document.createElement('span');
  rowSpan.style.pointerEvents = 'none';
  rowSpan.appendChild(rowPill.svg);
  rowBump.appendChild(rowSpan);
  cell.appendChild(rowBump);

  // ── Content wrapper (separate from cell DOM so PM doesn't clobber bumps) ──
  const contentDOM = document.createElement('div');
  contentDOM.style.cssText = 'min-height: 1em; outline: none;';
  cell.appendChild(contentDOM);

  // ── Determine if this cell is in the first row / first column ──
  function isFirstRow(): boolean {
    const tr = cell.closest('tr');
    if (!tr) return false;
    const tbody = tr.parentElement;
    if (!tbody) return false;
    return tbody.querySelector(':scope > tr') === tr;
  }

  function isFirstCol(): boolean {
    const tr = cell.closest('tr');
    if (!tr) return false;
    return tr.querySelector('td, th') === cell;
  }

  // ── Guard flag: prevent synthetic mouseenter on newly-visible bump ──
  let bumpReady = false;
  let bumpReadyTimer: ReturnType<typeof setTimeout> | null = null;

  function showBumps(showCol: boolean, showRow: boolean) {
    bumpReady = false;
    if (bumpReadyTimer) clearTimeout(bumpReadyTimer);
    if (showCol) colBump.style.display = 'block';
    if (showRow) rowBump.style.display = 'block';
    bumpReadyTimer = setTimeout(() => {
      bumpReady = true;
    }, 100);
  }

  function resetBumpFill(rect: SVGRectElement) {
    rect.setAttribute('fill', '#DFE1E6');
  }

  function hideBumps() {
    if (bumpReadyTimer) clearTimeout(bumpReadyTimer);
    bumpReady = false;
    colBump.style.display = 'none';
    rowBump.style.display = 'none';
    resetBumpFill(colRect);
    resetBumpFill(rowRect);
  }

  // ── Show/hide bumps on cell hover ──────────────────────────
  cell.addEventListener('mouseenter', () => {
    showBumps(isFirstRow(), isFirstCol());
  });
  cell.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === colBump || e.relatedTarget === rowBump) return;
    hideBumps();
  });

  colBump.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === cell) {
      resetBumpFill(colRect);
      return;
    }
    hideBumps();
  });

  rowBump.addEventListener('mouseleave', (e) => {
    if (e.relatedTarget === cell) {
      resetBumpFill(rowRect);
      return;
    }
    hideBumps();
  });

  // ── On bump hover: turn blue ──────────────────────────────────
  colBump.addEventListener('mouseenter', () => {
    if (!bumpReady) return;
    colRect.setAttribute('fill', '#0C66E4');
  });

  rowBump.addEventListener('mouseenter', () => {
    if (!bumpReady) return;
    rowRect.setAttribute('fill', '#0C66E4');
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
      cell.style.backgroundColor =
        bg || (isHeader ? '#F1F2F4' : 'transparent');
      return true;
    },
  };
}
