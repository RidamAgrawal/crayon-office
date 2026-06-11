import { Node } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  deleteColumn,
  deleteRow,
  setCellAttr,
  TableMap,
} from 'prosemirror-tables';

// ═══════════════════════════════════════════════════════════════════
// Constants & types
// ═══════════════════════════════════════════════════════════════════

const MIN_TABLE_WIDTH = 240;
const tableControlsKey = new PluginKey<TableControlsState>('tableControls');

interface TableControlsState {
  tablePos: number | null;
}

interface TableInfo {
  node: Node;
  pos: number;
}

interface TableDomInfo {
  wrapperEl: HTMLElement; // .tableView-content-wrap (nodeView dom)
  tableEl: HTMLElement; // <table>
}

interface TableHoverState {
  rowIndex: number | null;
  colIndex: number | null;
  rowMarkerIndex: number | null;
  colMarkerIndex: number | null;
  rowBoundaryIndex: number | null;
  colBoundaryIndex: number | null;
}

interface RowMetric {
  index: number;
  top: number;
  bottom: number;
  height: number;
}

interface ColMetric {
  index: number;
  left: number;
  right: number;
  width: number;
}

interface TableGridMetrics {
  tableRect: DOMRect;
  rowMetrics: RowMetric[];
  colMetrics: ColMetric[];
}

// ═══════════════════════════════════════════════════════════════════
// Pure helpers
// ═══════════════════════════════════════════════════════════════════

function findTable(state: EditorState): TableInfo | null {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.spec['tableRole'] === 'table') {
      return { node: $from.node(depth), pos: $from.before(depth) };
    }
  }

  return null;
}

function createEmptyHoverState(): TableHoverState {
  return {
    rowIndex: null,
    colIndex: null,
    rowMarkerIndex: null,
    colMarkerIndex: null,
    rowBoundaryIndex: null,
    colBoundaryIndex: null,
  };
}

function sameHoverState(a: TableHoverState, b: TableHoverState) {
  return (
    a.rowIndex === b.rowIndex &&
    a.colIndex === b.colIndex &&
    a.rowMarkerIndex === b.rowMarkerIndex &&
    a.colMarkerIndex === b.colMarkerIndex &&
    a.rowBoundaryIndex === b.rowBoundaryIndex &&
    a.colBoundaryIndex === b.colBoundaryIndex
  );
}

function findIndexForPoint<
  T extends {
    index: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  },
>(metrics: T[], point: number, axis: 'x' | 'y'): number | null {
  for (const metric of metrics) {
    const start = axis === 'x' ? metric.left! : metric.top!;
    const end = axis === 'x' ? metric.right! : metric.bottom!;

    if (point >= start && point <= end) {
      return metric.index;
    }
  }

  return null;
}

function getTableGridMetrics(tableNode: Node, tableEl: HTMLElement): TableGridMetrics {
  const tableRect = tableEl.getBoundingClientRect();
  const tbody = tableEl.querySelector('tbody') ?? tableEl;
  const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
  const rowMetrics = rows.map((rowEl, index) => {
    const rect = (rowEl as HTMLElement).getBoundingClientRect();
    return {
      index,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
    };
  });

  const map = TableMap.get(tableNode);
  const colCount = map.width;
  const totalWidth = tableRect.width || tableEl.offsetWidth || MIN_TABLE_WIDTH;
  const colEls = Array.from(tableEl.querySelectorAll('colgroup > col'));
  const rawWidths = Array.from({ length: colCount }, (_, index) => {
    const width = colEls[index]
      ? Number.parseFloat((colEls[index] as HTMLElement).style.width || '')
      : Number.NaN;

    return Number.isFinite(width) && width > 0 ? width : 0;
  });

  const positiveTotal = rawWidths.reduce((sum, width) => sum + width, 0);
  const zeroCount = rawWidths.filter((width) => width <= 0).length;
  const remainingWidth = Math.max(totalWidth - positiveTotal, 0);
  const fallbackWidth =
    zeroCount > 0
      ? remainingWidth > 0
        ? remainingWidth / zeroCount
        : totalWidth / colCount
      : totalWidth / Math.max(colCount, 1);

  let left = tableRect.left;
  const colMetrics = rawWidths.map((width, index) => {
    const resolvedWidth = width > 0 ? width : fallbackWidth;
    const metric = {
      index,
      left,
      right: left + resolvedWidth,
      width: resolvedWidth,
    };

    left += resolvedWidth;
    return metric;
  });

  return { tableRect, rowMetrics, colMetrics };
}

function getSelectedMarkerState(state: EditorState, tableNode: Node, tablePos: number) {
  const selection = state.selection;
  if (!(selection instanceof CellSelection)) {
    return { rowIndex: null, colIndex: null };
  }

  const map = TableMap.get(tableNode);

  try {
    const rect = map.findCell(selection.$anchorCell.pos - tablePos);
    return {
      rowIndex: selection.isRowSelection() ? rect.top : null,
      colIndex: selection.isColSelection() ? rect.left : null,
    };
  } catch {
    return { rowIndex: null, colIndex: null };
  }
}

function getHoverStateFromTableEvent(
  event: MouseEvent,
  tableEl: HTMLElement,
  gridMetrics: TableGridMetrics,
): TableHoverState {
  const target = event.target as HTMLElement | null;
  if (!target) return createEmptyHoverState();
  if (!tableEl.contains(target)) {
    return createEmptyHoverState();
  }
  const rowIndex = findIndexForPoint(gridMetrics.rowMetrics, event.clientY, 'y');
  const colIndex = findIndexForPoint(gridMetrics.colMetrics, event.clientX, 'x');

  if (rowIndex === null || colIndex === null) return createEmptyHoverState();

  const rowMetric = gridMetrics.rowMetrics[rowIndex];
  const colMetric = gridMetrics.colMetrics[colIndex];
  let rowBoundaryIndex: number | null = null;
  let colBoundaryIndex: number | null = null;

  if (rowMetric.bottom - event.clientY <= 6) {
    rowBoundaryIndex = rowIndex;
  } else if (event.clientY - rowMetric.top <= 6 && rowIndex > 0) {
    rowBoundaryIndex = rowIndex - 1;
  }

  if (colMetric.right - event.clientX <= 6) {
    colBoundaryIndex = colIndex;
  } else if (event.clientX - colMetric.left <= 6 && colIndex > 0) {
    colBoundaryIndex = colIndex - 1;
  }

  return {
    rowIndex,
    colIndex,
    rowMarkerIndex: null,
    colMarkerIndex: null,
    rowBoundaryIndex,
    colBoundaryIndex,
  };
}

// ═══════════════════════════════════════════════════════════════════
// DOM discovery helpers (find containers inside the node-view)
// ═══════════════════════════════════════════════════════════════════

function getTableDomInfo(view: EditorView, tablePos: number): TableDomInfo | null {
  const tableDOM = view.nodeDOM(tablePos) as HTMLElement | null;
  if (!tableDOM) return null;

  // New hierarchy: nodeDOM is .tableView-content-wrap
  const tableEl = tableDOM.querySelector('.pm-table-wrapper > table') as HTMLElement | null;
  if (tableEl) {
    return { wrapperEl: tableDOM, tableEl };
  }

  // Fallback: old flat structure
  if (tableDOM.tagName === 'TABLE') {
    const wrapperEl = tableDOM.parentElement?.classList.contains('tableWrapper')
      ? (tableDOM.parentElement as HTMLElement)
      : tableDOM;
    return { wrapperEl, tableEl: tableDOM };
  }

  const fallbackTable = tableDOM.querySelector('table') as HTMLElement | null;
  if (!fallbackTable) return null;
  return { wrapperEl: tableDOM, tableEl: fallbackTable };
}

// ═══════════════════════════════════════════════════════════════════
// Table width / row-height persistence
// ═══════════════════════════════════════════════════════════════════

function applyTableWidth(tableNode: Node, tableEl: HTMLElement) {
  const width = tableNode.attrs['width'];

  if (typeof width === 'number' && Number.isFinite(width) && width > 0) {
    tableEl.style.width = `${width}px`;
    tableEl.style.maxWidth = 'none';
    return;
  }

  tableEl.style.removeProperty('width');
  tableEl.style.removeProperty('max-width');
}

function applyRowHeights(tableNode: Node, tableEl: HTMLElement) {
  const tbody = tableEl.querySelector('tbody') ?? tableEl;
  const rows = Array.from(tbody.querySelectorAll(':scope > tr'));

  rows.forEach((rowEl, index) => {
    const height = tableNode.child(index)?.attrs['height'];
    if (typeof height === 'number' && Number.isFinite(height) && height > 0) {
      (rowEl as HTMLElement).style.height = `${height}px`;
    } else {
      (rowEl as HTMLElement).style.removeProperty('height');
    }
  });
}

function getRowPos(tableNode: Node, tablePos: number, rowIndex: number) {
  let rowPos = tablePos + 1;
  for (let index = 0; index < rowIndex; index++) {
    rowPos += tableNode.child(index).nodeSize;
  }
  return rowPos;
}

function setPersistedRowHeight(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
  height: number,
) {
  const rowNode = tableNode.child(rowIndex);
  if (!rowNode) return;

  const nextHeight = Math.max(32, Math.round(height));
  if (rowNode.attrs['height'] === nextHeight) return;

  const rowPos = getRowPos(tableNode, tablePos, rowIndex);
  view.dispatch(
    view.state.tr.setNodeMarkup(rowPos, undefined, {
      ...rowNode.attrs,
      height: nextHeight,
    }),
  );
  view.focus();
}

// ═══════════════════════════════════════════════════════════════════
// Row / Column selection helpers
// ═══════════════════════════════════════════════════════════════════

function resolveRowSelection(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
): CellSelection | null {
  const map = TableMap.get(tableNode);
  if (rowIndex < 0 || rowIndex >= map.height) return null;

  const firstCellPos = tablePos + map.positionAt(rowIndex, 0, tableNode);
  const lastCellPos = tablePos + map.positionAt(rowIndex, Math.max(map.width - 1, 0), tableNode);

  return CellSelection.rowSelection(
    view.state.doc.resolve(firstCellPos),
    view.state.doc.resolve(lastCellPos),
  );
}

function resolveColSelection(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  colIndex: number,
): CellSelection | null {
  const map = TableMap.get(tableNode);
  if (colIndex < 0 || colIndex >= map.width) return null;

  const firstCellPos = tablePos + map.positionAt(0, colIndex, tableNode);
  const lastCellPos = tablePos + map.positionAt(Math.max(map.height - 1, 0), colIndex, tableNode);

  return CellSelection.colSelection(
    view.state.doc.resolve(firstCellPos),
    view.state.doc.resolve(lastCellPos),
  );
}

function selectRow(view: EditorView, tableNode: Node, tablePos: number, rowIndex: number) {
  const selection = resolveRowSelection(view, tableNode, tablePos, rowIndex);
  if (!selection) return false;

  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
  return true;
}

function selectColumn(view: EditorView, tableNode: Node, tablePos: number, colIndex: number) {
  const selection = resolveColSelection(view, tableNode, tablePos, colIndex);
  if (!selection) return false;

  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
  return true;
}

function runRowCommand(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
  command: (state: EditorState, dispatch?: EditorView['dispatch']) => boolean,
) {
  if (!selectRow(view, tableNode, tablePos, rowIndex)) return;
  command(view.state, view.dispatch);
  view.focus();
}

function runColumnCommand(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  colIndex: number,
  command: (state: EditorState, dispatch?: EditorView['dispatch']) => boolean,
) {
  if (!selectColumn(view, tableNode, tablePos, colIndex)) return;
  command(view.state, view.dispatch);
  view.focus();
}

function clearRow(view: EditorView, tableNode: Node, tablePos: number, rowIndex: number) {
  if (!selectRow(view, tableNode, tablePos, rowIndex)) return;

  let rowPos = tablePos + 1;
  for (let index = 0; index < rowIndex; index++) {
    rowPos += tableNode.child(index).nodeSize;
  }

  const rowNode = tableNode.child(rowIndex);
  const tr = view.state.tr;

  rowNode.forEach((cell, cellOffset) => {
    const cellPos = rowPos + 1 + cellOffset;
    tr.replaceWith(
      cellPos + 1,
      cellPos + cell.nodeSize - 1,
      view.state.schema.nodes['paragraph'].create(),
    );
  });

  view.dispatch(tr);
  view.focus();
}

// ═══════════════════════════════════════════════════════════════════
// Context menu helpers
// ═══════════════════════════════════════════════════════════════════

function buildColorPicker(onPick: (color: string | null) => void): HTMLElement {
  const colors = [
    null,
    '#DEEBFF',
    '#B3D4FF',
    '#ABF5D1',
    '#FFF0B3',
    '#FFE380',
    '#FFBDAD',
    '#FFC400',
    '#FF7452',
    '#C0B6F2',
    '#998DD9',
    '#DFE1E6',
    '#6B778C',
  ];

  const picker = document.createElement('div');
  picker.style.cssText = `
    position: absolute; left: 100%; top: 0;
    background: #ffffff; border: 1px solid #dfe1e6; border-radius: 4px;
    padding: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); z-index: 1001;
    display: grid; grid-template-columns: repeat(4, 28px); gap: 4px;
  `;

  colors.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.style.cssText = `
      width: 28px; height: 28px; border-radius: 3px;
      border: 1px solid #dfe1e6; cursor: pointer;
      background: ${color ?? '#ffffff'};
      display: flex; align-items: center; justify-content: center;
    `;

    if (!color) {
      swatch.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12">
        <line x1="1" y1="1" x2="11" y2="11" stroke="#DE350B" stroke-width="1.5"/>
        <line x1="11" y1="1" x2="1" y2="11" stroke="#DE350B" stroke-width="1.5"/>
      </svg>`;
    }

    swatch.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onPick(color);
    });

    picker.appendChild(swatch);
  });

  return picker;
}

function buildMenu(
  items: Array<{
    label: string;
    shortcut?: string;
    danger?: boolean;
    hasSubmenu?: boolean;
    separator?: boolean;
    onClick: () => void;
    onHover?: (button: HTMLElement) => void;
    onHoverLeave?: (event: MouseEvent) => void;
  }>,
): HTMLElement {
  const menu = document.createElement('div');
  menu.className = '__pm-table-menu';
  menu.style.cssText = `
    position: fixed;
    background: #ffffff; border: 1px solid #dfe1e6; border-radius: 4px;
    padding: 4px 0; min-width: 200px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); z-index: 9999;
  `;

  items.forEach((item) => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.style.cssText = `height: 1px; background: #dfe1e6; margin: 4px 0;`;
      menu.appendChild(separator);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 7px 12px; background: none; border: none;
      cursor: pointer; font-size: 14px; text-align: left; position: relative;
      color: ${item.danger ? '#de350b' : '#172b4d'}; box-sizing: border-box;
    `;

    const left = document.createElement('span');
    left.style.cssText = `display: flex; align-items: center; gap: 8px; flex: 1;`;
    left.textContent = item.label;
    button.appendChild(left);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.textContent = item.shortcut;
      shortcut.style.cssText = `font-size: 11px; color: #6b778c; white-space: nowrap;`;
      button.appendChild(shortcut);
    }

    if (item.hasSubmenu) {
      const arrow = document.createElement('span');
      arrow.textContent = '>';
      arrow.style.cssText = `font-size: 16px; color: #6b778c; margin-left: 4px;`;
      button.appendChild(arrow);
    }

    button.addEventListener('mouseenter', () => {
      button.style.background = '#f1f2f4';
      item.onHover?.(button);
    });

    button.addEventListener('mouseleave', (event) => {
      button.style.background = 'none';
      item.onHoverLeave?.(event as MouseEvent);
    });

    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.onClick();
      menu.remove();
    });

    menu.appendChild(button);
  });

  return menu;
}

function showMenu(menu: HTMLElement, x: number, y: number) {
  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;

  const close = (event: MouseEvent) => {
    if (!menu.contains(event.target as HTMLElement)) {
      menu.remove();
      document.removeEventListener('mousedown', close);
    }
  };

  setTimeout(() => document.addEventListener('mousedown', close), 0);
}

// ═══════════════════════════════════════════════════════════════════
// SVG pill helper (reusable for drag handles)
// ═══════════════════════════════════════════════════════════════════

function buildPillSvg(fill: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('xmlns', ns);
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '5');
  svg.setAttribute('fill', 'none');

  const rect = document.createElementNS(ns, 'rect');
  rect.classList.add('pm-table-drag-handle-minimised');
  rect.setAttribute('width', '24');
  rect.setAttribute('height', '5');
  rect.setAttribute('rx', '3');
  rect.setAttribute('fill', fill);
  svg.appendChild(rect);

  return svg;
}

// ═══════════════════════════════════════════════════════════════════
// Row controls — grid-based, inside .pm-table-drag-row-controls
// ═══════════════════════════════════════════════════════════════════

function populateRowControls(
  container: HTMLElement,
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  pmTableContainer: HTMLElement,
  gridMetrics: TableGridMetrics,
  visibleRowIndex: number | null,
  emphasizedRowIndex: number | null,
) {
  container.innerHTML = '';

  // Position the row controls wrapper to the left of the table
  const tableRect = tableEl.getBoundingClientRect();
  const containerRect = pmTableContainer.getBoundingClientRect();
  const rowControlsWrapper = container.closest(
    '.pm-table-drag-row-controls-wrapper',
  ) as HTMLElement | null;
  if (rowControlsWrapper) {
    rowControlsWrapper.style.left = `${tableRect.left - containerRect.left - 14}px`;
    rowControlsWrapper.style.top = `${tableRect.top - containerRect.top}px`;
  }

  const rowHeights = gridMetrics.rowMetrics.map((m) => `${m.height || 40}px`).join(' ');

  container.style.cssText = `
    display: grid;
    grid-template-rows: ${rowHeights};
    grid-template-columns: 0px 14px 0px;
    pointer-events: auto;
  `;

  // ── Per-row insert-dot wrappers ─────────────────────────────
  gridMetrics.rowMetrics.forEach((_, ri) => {
    const dotWrapper = document.createElement('div');
    dotWrapper.setAttribute('data-start-index', String(ri));
    dotWrapper.setAttribute('data-end-index', String(ri + 1));
    dotWrapper.className = 'pm-table-drag-row-floating-insert-dot-wrapper';
    dotWrapper.contentEditable = 'false';
    dotWrapper.style.cssText = `grid-area: ${ri + 1} / 2 / span 1;`;

    const dot = document.createElement('div');
    dot.className = 'pm-table-drag-row-floating-insert-dot';
    dotWrapper.appendChild(dot);

    // Click → insert row after this row
    dotWrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectRow(view, tableNode, tablePos, ri);
      addRowAfter(view.state, view.dispatch);
      view.focus();
    });

    container.appendChild(dotWrapper);
  });

  // ── Floating drag handle (positioned at hovered / selected row) ──
  const targetRow = visibleRowIndex ?? 0;
  const isEmphasized = emphasizedRowIndex === targetRow;
  const appearance =
    visibleRowIndex != null ? (isEmphasized ? 'selected' : 'default') : 'placeholder';

  const handleSlot = document.createElement('div');
  handleSlot.setAttribute(
    'data-testid',
    `table-floating-row-${visibleRowIndex ?? 'undefined'}-drag-handle`,
  );
  handleSlot.setAttribute('data-handle-appearance', appearance);
  handleSlot.setAttribute('data-row-index', String(targetRow));
  handleSlot.dataset['tableRowMarker'] = String(targetRow);
  handleSlot.style.cssText = `
    grid-column: 2;
    grid-row: ${targetRow + 1};
    display: flex;
    width: 9px;
    height: 100%;
    position: relative;
    right: -0.5px;
    pointer-events: ${visibleRowIndex != null ? 'auto' : 'none'};
    align-items: center;
    opacity: ${visibleRowIndex != null ? 1 : 0};
    transition: opacity 0.12s ease;
  `;

  // Clickable zone
  const clickableZone = document.createElement('button');
  clickableZone.type = 'button';
  clickableZone.className = 'pm-table-drag-handle-button-clickable-zone';
  clickableZone.setAttribute('data-testid', 'table-drag-handle-clickable-zone-button');
  clickableZone.setAttribute('aria-label', 'Activate drag handle zone');
  clickableZone.style.cssText = `
    height: calc(100% - 16px); width: var(--ds-space-200, 16px);
    left: var(--ds-space-050, 4px); align-self: center;
    z-index: auto; pointer-events: auto;
    background: none; border: none; padding: 0; cursor: pointer;
  `;
  handleSlot.appendChild(clickableZone);

  // Handle button
  const handleBtn = document.createElement('button');
  handleBtn.type = 'button';
  handleBtn.id = 'drag-handle-button-row';
  handleBtn.className = `pm-table-drag-handle-button-container ${appearance}`;
  handleBtn.setAttribute('data-testid', 'table-drag-handle-button');
  handleBtn.setAttribute('aria-label', 'Row options');
  handleBtn.setAttribute('aria-expanded', 'false');
  handleBtn.setAttribute('aria-haspopup', 'menu');
  handleBtn.draggable = true;
  handleBtn.style.cssText = `
    transform: rotate(90deg); align-self: center;
    background: none; border: none; padding: 0; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  `;

  const iconSpan = document.createElement('span');
  iconSpan.style.pointerEvents = 'none';
  iconSpan.appendChild(buildPillSvg(isEmphasized ? '#0c66e4' : '#dfe1e6'));
  handleBtn.appendChild(iconSpan);
  handleSlot.appendChild(handleBtn);

  // ── Row context menu ────────────────────────────────────────
  const openRowMenu = (event: MouseEvent) => {
    if (visibleRowIndex == null) return;
    event.preventDefault();
    event.stopPropagation();
    const slotRect = handleSlot.getBoundingClientRect();
    selectRow(view, tableNode, tablePos, visibleRowIndex);

    let colorPicker: HTMLElement | null = null;
    const menu = buildMenu([
      {
        label: 'Add row above',
        shortcut: 'Ctrl+Alt+Up',
        onClick: () => runRowCommand(view, tableNode, tablePos, visibleRowIndex, addRowBefore),
      },
      {
        label: 'Add row below',
        shortcut: 'Ctrl+Alt+Down',
        onClick: () => runRowCommand(view, tableNode, tablePos, visibleRowIndex, addRowAfter),
      },
      { separator: true, label: '', onClick: () => {} },
      {
        label: 'Clear cells',
        onClick: () => clearRow(view, tableNode, tablePos, visibleRowIndex),
      },
      {
        label: 'Delete row',
        danger: true,
        onClick: () => runRowCommand(view, tableNode, tablePos, visibleRowIndex, deleteRow),
      },
      { separator: true, label: '', onClick: () => {} },
      {
        label: 'Background color',
        hasSubmenu: true,
        onClick: () => {},
        onHover: (button) => {
          if (colorPicker) return;
          colorPicker = buildColorPicker((color) => {
            if (selectRow(view, tableNode, tablePos, visibleRowIndex)) {
              setCellAttr('background', color ?? '')(view.state, view.dispatch);
            }
            document.querySelectorAll('.__pm-table-menu').forEach((el) => el.remove());
            colorPicker = null;
          });
          button.appendChild(colorPicker);
        },
        onHoverLeave: (event) => {
          if (!colorPicker?.contains(event.relatedTarget as HTMLElement)) {
            colorPicker?.remove();
            colorPicker = null;
          }
        },
      },
    ]);

    showMenu(menu, slotRect.right + 4, slotRect.top);
  };

  clickableZone.addEventListener('mousedown', openRowMenu);
  handleBtn.addEventListener('mousedown', openRowMenu);

  container.appendChild(handleSlot);
}

// ═══════════════════════════════════════════════════════════════════
// Column controls — grid-based, inside .pm-table-col-controls__inner
// ═══════════════════════════════════════════════════════════════════

function populateColControls(
  container: HTMLElement,
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  _pmTableContainer: HTMLElement,
  gridMetrics: TableGridMetrics,
  visibleColIndex: number | null,
  emphasizedColIndex: number | null,
) {
  container.innerHTML = '';

  // Position the column controls wrapper above the table
  const tableRect = tableEl.getBoundingClientRect();
  const wrapperEl = container.closest('.pm-table-col-controls-wrapper') as HTMLElement | null;
  if (wrapperEl) {
    const pmTableWrapper = wrapperEl.parentElement;
    if (pmTableWrapper) {
      const wrapperRect = pmTableWrapper.getBoundingClientRect();
      wrapperEl.style.top = `${tableRect.top - wrapperRect.top - 12}px`;
      wrapperEl.style.left = `${tableRect.left - wrapperRect.left}px`;
      wrapperEl.style.width = `${tableRect.width}px`;
    }
  }

  const colWidths = gridMetrics.colMetrics.map((m) => `${m.width || 100}px`).join(' ');

  container.style.cssText = `
    display: grid;
    grid-template-columns: ${colWidths};
    margin-top: 0px;
    overflow-x: visible;
  `;

  // ── Per-column insert-dot wrappers ──────────────────────────
  gridMetrics.colMetrics.forEach((_colMetric, ci) => {
    const dotWrapper = document.createElement('div');
    dotWrapper.setAttribute('data-start-index', String(ci));
    dotWrapper.setAttribute('data-end-index', String(ci + 1));
    dotWrapper.className = 'pm-table-drag-columns-floating-insert-dot-wrapper';
    dotWrapper.contentEditable = 'false';
    dotWrapper.style.cssText = `grid-column: ${ci + 1} / span 1;`;

    const dot = document.createElement('div');
    dot.className = 'pm-table-drag-columns-floating-insert-dot';
    if (ci === gridMetrics.colMetrics.length - 1) {
      dot.style.right = '0px';
    }
    dotWrapper.appendChild(dot);

    // Click → insert column after this column
    dotWrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectColumn(view, tableNode, tablePos, ci);
      addColumnAfter(view.state, view.dispatch);
      view.focus();
    });

    container.appendChild(dotWrapper);
  });

  // ── Floating drag handle (positioned at hovered / selected col) ──
  const targetCol = visibleColIndex ?? 0;
  const isEmphasized = emphasizedColIndex === targetCol;
  const appearance =
    visibleColIndex != null ? (isEmphasized ? 'selected' : 'default') : 'placeholder';

  const handleSlot = document.createElement('div');
  handleSlot.contentEditable = 'false';
  handleSlot.setAttribute(
    'data-testid',
    `table-floating-column-${visibleColIndex ?? 'placeholder'}-drag-handle`,
  );
  handleSlot.dataset['tableColMarker'] = String(targetCol);
  handleSlot.style.cssText = `
    grid-area: 1 / ${targetCol + 1} / auto / span 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: fit-content;
    place-self: center;
    z-index: 99;
    width: 100%;
    position: relative;
    pointer-events: ${visibleColIndex != null ? 'auto' : 'none'};
    opacity: ${visibleColIndex != null ? 1 : 0};
    transition: opacity 0.12s ease;
  `;

  // Clickable zone
  const clickableZone = document.createElement('button');
  clickableZone.type = 'button';
  clickableZone.className = 'pm-table-drag-handle-button-clickable-zone';
  clickableZone.setAttribute('data-testid', 'table-drag-handle-clickable-zone-button');
  clickableZone.setAttribute('aria-label', 'Activate drag handle zone');
  clickableZone.style.cssText = `
    height: var(--ds-space-200, 16px);
    width: calc(100% - 16px);
    bottom: var(--ds-space-0, 0px);
    z-index: -1; pointer-events: auto;
    background: none; border: none; padding: 0; cursor: pointer;
  `;
  handleSlot.appendChild(clickableZone);

  // Handle button
  const handleBtn = document.createElement('button');
  handleBtn.type = 'button';
  handleBtn.id = 'drag-handle-button-column';
  handleBtn.className = `pm-table-drag-handle-button-container ${appearance}`;
  handleBtn.setAttribute('data-testid', 'table-drag-handle-button');
  handleBtn.setAttribute('aria-label', 'Column options');
  handleBtn.setAttribute('aria-expanded', 'false');
  handleBtn.setAttribute('aria-haspopup', 'menu');
  handleBtn.draggable = true;
  handleBtn.style.cssText = `
    transform: none; background: none; border: none;
    padding: 0; cursor: pointer;
    display: flex; align-items: flex-start; justify-content: center;
  `;

  const iconSpan = document.createElement('span');
  iconSpan.style.pointerEvents = 'none';
  iconSpan.appendChild(buildPillSvg(isEmphasized ? '#0c66e4' : '#dfe1e6'));
  handleBtn.appendChild(iconSpan);
  handleSlot.appendChild(handleBtn);

  // ── Column context menu ─────────────────────────────────────
  const openColMenu = (event: MouseEvent) => {
    if (visibleColIndex == null) return;
    event.preventDefault();
    event.stopPropagation();
    const slotRect = handleSlot.getBoundingClientRect();
    selectColumn(view, tableNode, tablePos, visibleColIndex);

    let colorPicker: HTMLElement | null = null;
    const menu = buildMenu([
      {
        label: 'Insert column left',
        onClick: () =>
          runColumnCommand(view, tableNode, tablePos, visibleColIndex, addColumnBefore),
      },
      {
        label: 'Insert column right',
        onClick: () => runColumnCommand(view, tableNode, tablePos, visibleColIndex, addColumnAfter),
      },
      { separator: true, label: '', onClick: () => {} },
      {
        label: 'Delete column',
        danger: true,
        onClick: () => runColumnCommand(view, tableNode, tablePos, visibleColIndex, deleteColumn),
      },
      { separator: true, label: '', onClick: () => {} },
      {
        label: 'Background color',
        hasSubmenu: true,
        onClick: () => {},
        onHover: (button) => {
          if (colorPicker) return;
          colorPicker = buildColorPicker((color) => {
            if (selectColumn(view, tableNode, tablePos, visibleColIndex)) {
              setCellAttr('background', color ?? '')(view.state, view.dispatch);
            }
            document.querySelectorAll('.__pm-table-menu').forEach((el) => el.remove());
            colorPicker = null;
          });
          button.appendChild(colorPicker);
        },
        onHoverLeave: (event) => {
          if (!colorPicker?.contains(event.relatedTarget as HTMLElement)) {
            colorPicker?.remove();
            colorPicker = null;
          }
        },
      },
    ]);

    showMenu(menu, slotRect.left, slotRect.bottom + 4);
  };

  clickableZone.addEventListener('mousedown', openColMenu);
  handleBtn.addEventListener('mousedown', openColMenu);

  container.appendChild(handleSlot);
}

// ═══════════════════════════════════════════════════════════════════
// Boundary guides (resize lines + insert dots between rows/cols)
// Absolutely positioned inside .pm-table-container
// ═══════════════════════════════════════════════════════════════════

function buildBoundaryGuides(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  _tableEl: HTMLElement,
  pmTableContainer: HTMLElement,
  hoverState: TableHoverState,
  gridMetrics: TableGridMetrics,
  onRowResizeStart: (event: MouseEvent, rowIndex: number) => void,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = '__pm-table-boundary-guides';
  wrapper.contentEditable = 'false';
  wrapper.style.cssText = `
    position: absolute; inset: 0;
    pointer-events: none; z-index: 11;
  `;

  const tableRect = gridMetrics.tableRect;
  const containerRect = pmTableContainer.getBoundingClientRect();

  // ── Row boundary lines + dots ───────────────────────────────
  for (let ri = 0; ri < gridMetrics.rowMetrics.length - 1; ri++) {
    const rowMetric = gridMetrics.rowMetrics[ri];
    const isHovered = hoverState.rowBoundaryIndex === ri;

    if (isHovered) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: ${tableRect.left - containerRect.left}px;
        top: ${rowMetric.bottom - containerRect.top - 2}px;
        width: ${tableRect.width}px;
        height: 4px;
        background: #0c66e4;
        border-radius: 999px;
        cursor: row-resize;
        pointer-events: auto;
      `;
      line.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onRowResizeStart(event, rowMetric.index);
      });
      wrapper.appendChild(line);
    }

    const dotSize = isHovered ? 18 : 8;
    const rowDot = document.createElement('div');
    rowDot.className = 'pm-table-drag-row-floating-insert-dot';
    rowDot.style.cssText = `
      position: absolute;
      left: ${tableRect.left - containerRect.left - 14 - dotSize / 2}px;
      top: ${rowMetric.bottom - containerRect.top - dotSize / 2}px;
      width: ${dotSize}px; height: ${dotSize}px;
      background: ${isHovered ? '#0c66e4' : '#DFE1E6'};
      border-radius: 50%;
      pointer-events: auto; cursor: pointer; z-index: 12;
      transition: background 0.15s, width 0.15s, height 0.15s;
      display: flex; align-items: center; justify-content: center;
    `;

    if (isHovered) {
      const plus = document.createElement('span');
      plus.textContent = '+';
      plus.style.cssText = `
        color: #ffffff; font-size: 14px; font-weight: 700;
        line-height: 1; pointer-events: none;
      `;
      rowDot.appendChild(plus);
    }

    rowDot.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectRow(view, tableNode, tablePos, rowMetric.index);
      addRowAfter(view.state, view.dispatch);
      view.focus();
    });
    wrapper.appendChild(rowDot);
  }

  // ── Column boundary lines + dots ────────────────────────────
  for (let ci = 0; ci < gridMetrics.colMetrics.length - 1; ci++) {
    const colMetric = gridMetrics.colMetrics[ci];
    const isHovered = hoverState.colBoundaryIndex === ci;

    if (isHovered) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: ${colMetric.right - containerRect.left - 1}px;
        top: ${tableRect.top - containerRect.top}px;
        width: 2px; height: ${tableRect.height}px;
        background: #0c66e4;
        border-radius: 999px;
      `;
      wrapper.appendChild(line);
    }

    const dotSize = isHovered ? 18 : 8;
    const colDot = document.createElement('div');
    colDot.className = 'pm-table-drag-columns-floating-insert-dot';
    colDot.style.cssText = `
      position: absolute;
      left: ${colMetric.right - containerRect.left - dotSize / 2}px;
      top: ${tableRect.top - containerRect.top - 14 - dotSize / 2}px;
      width: ${dotSize}px; height: ${dotSize}px;
      background: ${isHovered ? '#0c66e4' : '#DFE1E6'};
      border-radius: 50%;
      pointer-events: auto; cursor: pointer; z-index: 12;
      transition: background 0.15s, width 0.15s, height 0.15s;
      display: flex; align-items: center; justify-content: center;
    `;

    if (isHovered) {
      const plus = document.createElement('span');
      plus.textContent = '+';
      plus.style.cssText = `
        color: #ffffff; font-size: 14px; font-weight: 700;
        line-height: 1; pointer-events: none;
      `;
      colDot.appendChild(plus);
    }

    colDot.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectColumn(view, tableNode, tablePos, colMetric.index);
      addColumnAfter(view.state, view.dispatch);
      view.focus();
    });
    wrapper.appendChild(colDot);
  }

  return wrapper;
}

// ═══════════════════════════════════════════════════════════════════
// Plugin
// ═══════════════════════════════════════════════════════════════════

export function tableControlsPlugin(): Plugin {
  return new Plugin({
    key: tableControlsKey,
    state: {
      init(): TableControlsState {
        return { tablePos: null };
      },
      apply(tr, prev): TableControlsState {
        if (!tr.selectionSet && !tr.docChanged) return prev;

        const { $from } = tr.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.spec['tableRole'] === 'table') {
            return { tablePos: $from.before(depth) };
          }
        }

        return { tablePos: null };
      },
    },

    view(editorView: EditorView) {
      const editorEl = editorView.dom as HTMLElement;
      const editorContainer = editorEl.parentElement ?? editorEl;

      // Ensure the editor container is a positioning ancestor
      if (getComputedStyle(editorContainer).position === 'static') {
        editorContainer.style.position = 'relative';
      }

      let currentWrapperEl: HTMLElement | null = null;
      let currentTableEl: HTMLElement | null = null;
      let currentGridMetrics: TableGridMetrics | null = null;
      let hoverState = createEmptyHoverState();
      let isRowResizing = false;
      let guidesEl: HTMLElement | null = null;

      const cleanup = () => {
        // Clear controls in the previously-active table's containers
        if (currentWrapperEl) {
          const rowCtrl = currentWrapperEl.querySelector(
            '.pm-table-drag-row-controls',
          ) as HTMLElement | null;
          if (rowCtrl) {
            rowCtrl.innerHTML = '';
            rowCtrl.removeAttribute('style');
          }
          const colCtrl = currentWrapperEl.querySelector(
            '.pm-table-col-controls__inner',
          ) as HTMLElement | null;
          if (colCtrl) {
            colCtrl.innerHTML = '';
            colCtrl.removeAttribute('style');
          }
        }
        guidesEl?.remove();
        guidesEl = null;
        currentWrapperEl = null;
        currentTableEl = null;
        currentGridMetrics = null;

        document.querySelectorAll('.__pm-table-menu').forEach((el) => el.remove());
      };

      const startRowResize = (
        event: MouseEvent,
        view: EditorView,
        tableNode: Node,
        tablePos: number,
        tableEl: HTMLElement,
        rowIndex: number,
      ) => {
        const tbody = tableEl.querySelector('tbody') ?? tableEl;
        const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
        const rowEl = rows[rowIndex] as HTMLElement | undefined;
        if (!rowEl) return;

        isRowResizing = true;
        const startY = event.clientY;
        const persistedHeight = tableNode.child(rowIndex)?.attrs['height'];
        const startHeight =
          typeof persistedHeight === 'number' &&
          Number.isFinite(persistedHeight) &&
          persistedHeight > 0
            ? persistedHeight
            : rowEl.getBoundingClientRect().height || 32;

        let currentHeight = startHeight;

        const onMove = (moveEvent: MouseEvent) => {
          currentHeight = Math.max(32, startHeight + moveEvent.clientY - startY);
          rowEl.style.height = `${Math.round(currentHeight)}px`;
        };

        const onUp = () => {
          isRowResizing = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          setPersistedRowHeight(view, tableNode, tablePos, rowIndex, currentHeight);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };

      const render = (view: EditorView) => {
        cleanup();

        const tableInfo = findTable(view.state);
        if (!tableInfo) return;

        const tableDomInfo = getTableDomInfo(view, tableInfo.pos);
        if (!tableDomInfo) return;

        currentWrapperEl = tableDomInfo.wrapperEl;
        currentTableEl = tableDomInfo.tableEl;

        applyTableWidth(tableInfo.node, tableDomInfo.tableEl);
        applyRowHeights(tableInfo.node, tableDomInfo.tableEl);

        const gridMetrics = getTableGridMetrics(tableInfo.node, tableDomInfo.tableEl);
        currentGridMetrics = gridMetrics;

        const selectedMarkers = getSelectedMarkerState(view.state, tableInfo.node, tableInfo.pos);

        // ── Find containers inside the node-view DOM ──────────
        const rowControlsEl = currentWrapperEl.querySelector(
          '.pm-table-drag-row-controls',
        ) as HTMLElement | null;
        const colControlsEl = currentWrapperEl.querySelector(
          '.pm-table-col-controls__inner',
        ) as HTMLElement | null;
        const pmTableContainer = currentWrapperEl.querySelector(
          '.pm-table-container',
        ) as HTMLElement | null;

        // ── Populate row controls ─────────────────────────────
        if (rowControlsEl && pmTableContainer) {
          populateRowControls(
            rowControlsEl,
            view,
            tableInfo.node,
            tableInfo.pos,
            tableDomInfo.tableEl,
            pmTableContainer,
            gridMetrics,
            hoverState.rowIndex ?? selectedMarkers.rowIndex,
            hoverState.rowMarkerIndex ?? selectedMarkers.rowIndex,
          );
        }

        // ── Populate column controls ──────────────────────────
        if (colControlsEl && pmTableContainer) {
          populateColControls(
            colControlsEl,
            view,
            tableInfo.node,
            tableInfo.pos,
            tableDomInfo.tableEl,
            pmTableContainer,
            gridMetrics,
            hoverState.colIndex ?? selectedMarkers.colIndex,
            hoverState.colMarkerIndex ?? selectedMarkers.colIndex,
          );
        }

        // ── Boundary guides (resize lines + insert dots) ──────
        if (pmTableContainer) {
          guidesEl = buildBoundaryGuides(
            view,
            tableInfo.node,
            tableInfo.pos,
            tableDomInfo.tableEl,
            pmTableContainer,
            hoverState,
            gridMetrics,
            (event, rowIndex) =>
              startRowResize(
                event,
                view,
                tableInfo.node,
                tableInfo.pos,
                tableDomInfo.tableEl,
                rowIndex,
              ),
          );
          pmTableContainer.appendChild(guidesEl);
        }
      };

      const updateHoverState = (nextHoverState: TableHoverState) => {
        if (isRowResizing) return;
        if (sameHoverState(hoverState, nextHoverState)) return;
        hoverState = nextHoverState;
        render(editorView);
      };

      const clearHoverState = () => {
        updateHoverState(createEmptyHoverState());
      };

      const handlePointerMove = (event: MouseEvent) => {
        if (isRowResizing) return;
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // Don't update hover when over toolbar, menus, or resize handles
        if (
          target.closest('.__pm-table-toolbar') ||
          target.closest('.resizer-handle-wrapper') ||
          target.closest('.__pm-table-menu')
        ) {
          return;
        }

        // Check if over a row marker (drag handle)
        const rowMarker = target.closest('[data-table-row-marker]') as HTMLElement | null;
        if (rowMarker) {
          updateHoverState({
            ...createEmptyHoverState(),
            rowIndex: Number(rowMarker.dataset['tableRowMarker']),
            rowMarkerIndex: Number(rowMarker.dataset['tableRowMarker']),
          });
          return;
        }

        // Check if over a column marker (drag handle)
        const colMarker = target.closest('[data-table-col-marker]') as HTMLElement | null;
        if (colMarker) {
          updateHoverState({
            ...createEmptyHoverState(),
            colIndex: Number(colMarker.dataset['tableColMarker']),
            colMarkerIndex: Number(colMarker.dataset['tableColMarker']),
          });
          return;
        }

        // If not over the active table, clear hover
        if (!currentTableEl || !currentGridMetrics || !currentTableEl.contains(target)) {
          clearHoverState();
          return;
        }

        updateHoverState(getHoverStateFromTableEvent(event, currentTableEl, currentGridMetrics));
      };

      const handleExternalLayout = () => {
        render(editorView);
      };

      editorContainer.addEventListener('mousemove', handlePointerMove);
      editorContainer.addEventListener('mouseleave', clearHoverState);
      window.addEventListener('resize', handleExternalLayout);
      window.addEventListener('scroll', handleExternalLayout, true);
      editorContainer.addEventListener('scroll', handleExternalLayout, true);

      render(editorView);

      return {
        update(view: EditorView) {
          render(view);
        },
        destroy() {
          cleanup();
          editorContainer.removeEventListener('mousemove', handlePointerMove);
          editorContainer.removeEventListener('mouseleave', clearHoverState);
          window.removeEventListener('resize', handleExternalLayout);
          window.removeEventListener('scroll', handleExternalLayout, true);
          editorContainer.removeEventListener('scroll', handleExternalLayout, true);
        },
      };
    },
  });
}
