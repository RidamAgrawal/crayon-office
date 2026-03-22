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
  deleteTable,
  mergeCells,
  setCellAttr,
  splitCell,
  TableMap,
  toggleHeaderRow,
} from 'prosemirror-tables';

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
  wrapperEl: HTMLElement;
  tableEl: HTMLElement;
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

function findIndexForPoint<T extends { index: number; top?: number; bottom?: number; left?: number; right?: number }>(
  metrics: T[],
  point: number,
  axis: 'x' | 'y',
): number | null {
  for (const metric of metrics) {
    const start = axis === 'x' ? metric.left! : metric.top!;
    const end = axis === 'x' ? metric.right! : metric.bottom!;

    if (point >= start && point <= end) {
      return metric.index;
    }
  }

  return null;
}

function getTableGridMetrics(
  tableNode: Node,
  tableEl: HTMLElement,
): TableGridMetrics {
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
      ? (remainingWidth > 0 ? remainingWidth / zeroCount : totalWidth / colCount)
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

function getSelectedMarkerState(
  state: EditorState,
  tableNode: Node,
  tablePos: number,
) {
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

function getTableDomInfo(
  view: EditorView,
  tablePos: number,
): TableDomInfo | null {
  const tableDOM = view.nodeDOM(tablePos) as HTMLElement | null;
  if (!tableDOM) return null;

  if (tableDOM.tagName === 'TABLE') {
    const wrapperEl =
      tableDOM.parentElement?.classList.contains('tableWrapper')
        ? (tableDOM.parentElement as HTMLElement)
        : tableDOM;

    return { wrapperEl, tableEl: tableDOM };
  }

  const tableEl = tableDOM.querySelector('table') as HTMLElement | null;
  if (!tableEl) return null;

  return { wrapperEl: tableDOM, tableEl };
}

function getControlContainer(editorEl: HTMLElement): HTMLElement {
  const container = editorEl.parentElement ?? editorEl;

  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  return container;
}

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

function setPersistedTableWidth(
  view: EditorView,
  tablePos: number,
  width: number,
) {
  const tableNode = view.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const nextWidth = Math.max(MIN_TABLE_WIDTH, Math.round(width));
  if (tableNode.attrs['width'] === nextWidth) return;

  view.dispatch(
    view.state.tr.setNodeMarkup(tablePos, undefined, {
      ...tableNode.attrs,
      width: nextWidth,
    }),
  );
  view.focus();
}

function applyRowHeights(tableNode: Node, tableEl: HTMLElement) {
  const tbody = tableEl.querySelector('tbody') ?? tableEl;
  const rows = Array.from(tbody.querySelectorAll(':scope > tr'));

  rows.forEach((rowEl, index) => {
    const height = tableNode.child(index)?.attrs['height'];
    if (
      typeof height === 'number' &&
      Number.isFinite(height) &&
      height > 0
    ) {
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

function resolveRowSelection(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
): CellSelection | null {
  const map = TableMap.get(tableNode);
  if (rowIndex < 0 || rowIndex >= map.height) return null;

  const firstCellPos = tablePos + map.positionAt(rowIndex, 0, tableNode);
  const lastCellPos =
    tablePos + map.positionAt(rowIndex, Math.max(map.width - 1, 0), tableNode);

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
  const lastCellPos =
    tablePos + map.positionAt(Math.max(map.height - 1, 0), colIndex, tableNode);

  return CellSelection.colSelection(
    view.state.doc.resolve(firstCellPos),
    view.state.doc.resolve(lastCellPos),
  );
}

function selectRow(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
) {
  const selection = resolveRowSelection(view, tableNode, tablePos, rowIndex);
  if (!selection) return false;

  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
  return true;
}

function selectColumn(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  colIndex: number,
) {
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

function clearRow(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  rowIndex: number,
) {
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
    position: absolute;
    left: 100%;
    top: 0;
    background: #ffffff;
    border: 1px solid #dfe1e6;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    display: grid;
    grid-template-columns: repeat(4, 28px);
    gap: 4px;
  `;

  colors.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 3px;
      border: 1px solid #dfe1e6;
      cursor: pointer;
      background: ${color ?? '#ffffff'};
      display: flex;
      align-items: center;
      justify-content: center;
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
    background: #ffffff;
    border: 1px solid #dfe1e6;
    border-radius: 4px;
    padding: 4px 0;
    min-width: 200px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 9999;
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 7px 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      text-align: left;
      position: relative;
      color: ${item.danger ? '#de350b' : '#172b4d'};
      box-sizing: border-box;
    `;

    const left = document.createElement('span');
    left.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    `;
    left.textContent = item.label;
    button.appendChild(left);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.textContent = item.shortcut;
      shortcut.style.cssText = `
        font-size: 11px;
        color: #6b778c;
        white-space: nowrap;
      `;
      button.appendChild(shortcut);
    }

    if (item.hasSubmenu) {
      const arrow = document.createElement('span');
      arrow.textContent = '>';
      arrow.style.cssText = `
        font-size: 16px;
        color: #6b778c;
        margin-left: 4px;
      `;
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

function buildRowControls(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  container: HTMLElement,
  visibleRowIndex: number | null,
  emphasizedRowIndex: number | null,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = '__pm-row-controls';
  wrapper.contentEditable = 'false';

  const tableRect = tableEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  wrapper.style.cssText = `
    position: absolute;
    left: ${tableRect.left - containerRect.left - 18}px;
    top: ${tableRect.top - containerRect.top}px;
    display: flex;
    flex-direction: column;
    z-index: 10;
    pointer-events: none;
  `;

  const tbody = tableEl.querySelector('tbody') ?? tableEl;
  const rows = Array.from(tbody.querySelectorAll(':scope > tr'));

  rows.forEach((rowEl, rowIndex) => {
    const rowRect = (rowEl as HTMLElement).getBoundingClientRect();
    const isVisible = visibleRowIndex === rowIndex;
    const isEmphasized = emphasizedRowIndex === rowIndex;
    const slot = document.createElement('div');
    slot.dataset['tableRowMarker'] = String(rowIndex);
    slot.style.cssText = `
      width: 18px;
      height: ${rowRect.height || 40}px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: ${isVisible ? 'auto' : 'none'};
      cursor: pointer;
      flex-shrink: 0;
      opacity: ${isVisible ? 1 : 0};
      transition: opacity 0.12s ease;
    `;

    const marker = document.createElement('div');
    marker.style.cssText = `
      width: 16px;
      height: 28px;
      border-radius: 6px;
      background: ${isEmphasized ? '#0c66e4' : '#dfe1e6'};
      box-shadow: ${isEmphasized
        ? '0 1px 2px rgba(9, 30, 66, 0.24)'
        : '0 1px 2px rgba(9, 30, 66, 0.12)'};
      transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      display: grid;
      grid-template-columns: repeat(2, 2px);
      grid-auto-rows: 2px;
      gap: 2px 3px;
      place-content: center;
      flex-shrink: 0;
      transform: ${isEmphasized ? 'scale(1)' : 'scale(0.92)'};
    `;

    for (let index = 0; index < 6; index++) {
      const dot = document.createElement('span');
      dot.style.cssText = `
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background: ${isEmphasized ? '#ffffff' : '#6b778c'};
      `;
      marker.appendChild(dot);
    }

    slot.appendChild(marker);

    slot.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slotRect = slot.getBoundingClientRect();
      selectRow(view, tableNode, tablePos, rowIndex);

      let colorPicker: HTMLElement | null = null;
      const menu = buildMenu([
        {
          label: 'Add row above',
          shortcut: 'Ctrl+Alt+Up',
          onClick: () =>
            runRowCommand(view, tableNode, tablePos, rowIndex, addRowBefore),
        },
        {
          label: 'Add row below',
          shortcut: 'Ctrl+Alt+Down',
          onClick: () =>
            runRowCommand(view, tableNode, tablePos, rowIndex, addRowAfter),
        },
        { separator: true, label: '', onClick: () => {} },
        {
          label: 'Clear cells',
          onClick: () => clearRow(view, tableNode, tablePos, rowIndex),
        },
        {
          label: 'Delete row',
          danger: true,
          onClick: () =>
            runRowCommand(view, tableNode, tablePos, rowIndex, deleteRow),
        },
        { separator: true, label: '', onClick: () => {} },
        {
          label: 'Background color',
          hasSubmenu: true,
          onClick: () => {},
          onHover: (button) => {
            if (colorPicker) return;

            colorPicker = buildColorPicker((color) => {
              if (selectRow(view, tableNode, tablePos, rowIndex)) {
                setCellAttr('background', color ?? '')(
                  view.state,
                  view.dispatch,
                );
              }

              document
                .querySelectorAll('.__pm-table-menu')
                .forEach((menuElement) => menuElement.remove());
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
    });

    wrapper.appendChild(slot);
  });

  return wrapper;
}

function buildColControls(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  container: HTMLElement,
  visibleColIndex: number | null,
  emphasizedColIndex: number | null,
  gridMetrics: TableGridMetrics,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = '__pm-col-controls';
  wrapper.contentEditable = 'false';

  const tableRect = tableEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  wrapper.style.cssText = `
    position: absolute;
    left: ${tableRect.left - containerRect.left}px;
    top: ${tableRect.top - containerRect.top - 16}px;
    display: flex;
    flex-direction: row;
    z-index: 10;
    pointer-events: none;
  `;

  gridMetrics.colMetrics.forEach((colMetric, colIndex) => {
    const isVisible = visibleColIndex === colIndex;
    const isEmphasized = emphasizedColIndex === colIndex;
    const slot = document.createElement('div');
    slot.dataset['tableColMarker'] = String(colIndex);
    slot.style.cssText = `
      width: ${colMetric.width || 100}px;
      height: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: ${isVisible ? 'auto' : 'none'};
      cursor: pointer;
      opacity: ${isVisible ? 1 : 0};
      transition: opacity 0.12s ease;
    `;

    const marker = document.createElement('div');
    marker.style.cssText = `
      width: 34px;
      height: 8px;
      border-radius: 999px;
      background: ${isEmphasized ? '#0c66e4' : '#dfe1e6'};
      box-shadow: ${isEmphasized
        ? '0 1px 2px rgba(9, 30, 66, 0.18)'
        : 'inset 0 0 0 1px rgba(255, 255, 255, 0.65)'};
      transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      transform: ${isEmphasized ? 'scale(1)' : 'scale(0.94)'};
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const grip = document.createElement('div');
    grip.style.cssText = `
      width: 14px;
      height: 2px;
      border-radius: 999px;
      background: ${isEmphasized ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)'};
    `;
    marker.appendChild(grip);
    slot.appendChild(marker);

    slot.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slotRect = slot.getBoundingClientRect();
      selectColumn(view, tableNode, tablePos, colIndex);

      let colorPicker: HTMLElement | null = null;
      const menu = buildMenu([
        {
          label: 'Insert column left',
          onClick: () =>
            runColumnCommand(
              view,
              tableNode,
              tablePos,
              colIndex,
              addColumnBefore,
            ),
        },
        {
          label: 'Insert column right',
          onClick: () =>
            runColumnCommand(
              view,
              tableNode,
              tablePos,
              colIndex,
              addColumnAfter,
            ),
        },
        { separator: true, label: '', onClick: () => {} },
        {
          label: 'Delete column',
          danger: true,
          onClick: () =>
            runColumnCommand(
              view,
              tableNode,
              tablePos,
              colIndex,
              deleteColumn,
            ),
        },
        { separator: true, label: '', onClick: () => {} },
        {
          label: 'Background color',
          hasSubmenu: true,
          onClick: () => {},
          onHover: (button) => {
            if (colorPicker) return;

            colorPicker = buildColorPicker((color) => {
              if (selectColumn(view, tableNode, tablePos, colIndex)) {
                setCellAttr('background', color ?? '')(
                  view.state,
                  view.dispatch,
                );
              }

              document
                .querySelectorAll('.__pm-table-menu')
                .forEach((menuElement) => menuElement.remove());
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
    });

    wrapper.appendChild(slot);
  });

  return wrapper;
}

function buildBoundaryGuides(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  container: HTMLElement,
  hoverState: TableHoverState,
  gridMetrics: TableGridMetrics,
  onRowResizeStart: (event: MouseEvent, rowIndex: number) => void,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = '__pm-table-boundary-guides';
  wrapper.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 11;
  `;

  const tableRect = gridMetrics.tableRect;
  const containerRect = container.getBoundingClientRect();

  if (hoverState.rowBoundaryIndex !== null) {
    const rowMetric = gridMetrics.rowMetrics[hoverState.rowBoundaryIndex];

    if (rowMetric) {
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
  }

  if (hoverState.colBoundaryIndex !== null) {
    const colMetric = gridMetrics.colMetrics[hoverState.colBoundaryIndex];

    if (colMetric) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: ${colMetric.right - containerRect.left - 1}px;
        top: ${tableRect.top - containerRect.top}px;
        width: 2px;
        height: ${tableRect.height}px;
        background: #0c66e4;
        border-radius: 999px;
      `;
      wrapper.appendChild(line);
    }
  }

  return wrapper;
}

function buildFloatingToolbar(
  view: EditorView,
  tableEl: HTMLElement,
  container: HTMLElement,
): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.className = '__pm-table-toolbar';
  toolbar.contentEditable = 'false';

  const tableRect = tableEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  toolbar.style.cssText = `
    position: absolute;
    left: ${tableRect.left - containerRect.left + tableRect.width / 2}px;
    top: ${tableRect.bottom - containerRect.top + 14}px;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: #ffffff;
    border: 1px solid #dfe1e6;
    border-radius: 8px;
    box-shadow: 0 8px 18px rgba(9, 30, 66, 0.15);
    z-index: 12;
    white-space: nowrap;
  `;

  const makeButton = (
    label: string,
    onMouseDown: (event: MouseEvent) => void,
    style = '',
  ) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = `
      background: none;
      border: none;
      color: #172b4d;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      ${style}
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#f1f2f4';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
    });

    button.addEventListener('mousedown', onMouseDown);
    return button;
  };

  const makeSeparator = () => {
    const separator = document.createElement('div');
    separator.style.cssText = `
      width: 1px;
      height: 22px;
      background: #dfe1e6;
    `;
    return separator;
  };

  const tableOptionsButton = makeButton('Table options', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const menu = buildMenu([
      {
        label: 'Toggle header row',
        onClick: () => {
          toggleHeaderRow(view.state, view.dispatch);
          view.focus();
        },
      },
      {
        label: 'Merge selected cells',
        onClick: () => {
          mergeCells(view.state, view.dispatch);
          view.focus();
        },
      },
      {
        label: 'Split selected cell',
        onClick: () => {
          splitCell(view.state, view.dispatch);
          view.focus();
        },
      },
      { separator: true, label: '', onClick: () => {} },
      {
        label: 'Delete table',
        danger: true,
        onClick: () => {
          deleteTable(view.state, view.dispatch);
          view.focus();
        },
      },
    ]);

    const rect = tableOptionsButton.getBoundingClientRect();
    showMenu(menu, rect.left, rect.bottom + 6);
  });

  const addRowButton = makeButton('Add row', (event) => {
    event.preventDefault();
    event.stopPropagation();
    addRowAfter(view.state, view.dispatch);
    view.focus();
  });

  const addColumnButton = makeButton('Add column', (event) => {
    event.preventDefault();
    event.stopPropagation();
    addColumnAfter(view.state, view.dispatch);
    view.focus();
  });

  const deleteButton = makeButton(
    'Delete',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteTable(view.state, view.dispatch);
      view.focus();
    },
    'color: #de350b;',
  );

  toolbar.appendChild(tableOptionsButton);
  toolbar.appendChild(makeSeparator());
  toolbar.appendChild(addRowButton);
  toolbar.appendChild(addColumnButton);
  toolbar.appendChild(makeSeparator());
  toolbar.appendChild(deleteButton);

  return toolbar;
}

function buildTableResizeHandle(
  view: EditorView,
  tableNode: Node,
  tablePos: number,
  tableEl: HTMLElement,
  container: HTMLElement,
): HTMLElement {
  const handle = document.createElement('div');
  handle.className = '__pm-table-resize-handle';
  handle.contentEditable = 'false';

  const tableRect = tableEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  handle.style.cssText = `
    position: absolute;
    left: ${tableRect.right - containerRect.left - 5}px;
    top: ${tableRect.top - containerRect.top}px;
    width: 10px;
    height: ${tableRect.height}px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    z-index: 13;
  `;

  const bar = document.createElement('div');
  bar.style.cssText = `
    width: 3px;
    height: calc(100% - 8px);
    border-radius: 999px;
    background: #c7d1db;
    transition: background 0.15s;
  `;
  handle.appendChild(bar);

  let dragging = false;

  const positionHandle = () => {
    const nextTableRect = tableEl.getBoundingClientRect();
    const nextContainerRect = container.getBoundingClientRect();
    handle.style.left = `${nextTableRect.right - nextContainerRect.left - 5}px`;
    handle.style.top = `${nextTableRect.top - nextContainerRect.top}px`;
    handle.style.height = `${nextTableRect.height}px`;
  };

  handle.addEventListener('mouseenter', () => {
    bar.style.background = '#0c66e4';
  });

  handle.addEventListener('mouseleave', () => {
    if (!dragging) {
      bar.style.background = '#c7d1db';
    }
  });

  handle.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragging = true;
    bar.style.background = '#0c66e4';

    const startX = event.clientX;
    const startWidth =
      (typeof tableNode.attrs['width'] === 'number' &&
      Number.isFinite(tableNode.attrs['width'])
        ? tableNode.attrs['width']
        : tableEl.getBoundingClientRect().width) || MIN_TABLE_WIDTH;

    let currentWidth = startWidth;

    const onMove = (moveEvent: MouseEvent) => {
      currentWidth = Math.max(
        MIN_TABLE_WIDTH,
        startWidth + (moveEvent.clientX - startX),
      );
      tableEl.style.width = `${Math.round(currentWidth)}px`;
      tableEl.style.maxWidth = 'none';
      positionHandle();
    };

    const onUp = () => {
      dragging = false;
      bar.style.background = '#c7d1db';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setPersistedTableWidth(view, tablePos, currentWidth);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  return handle;
}

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
      const container = getControlContainer(editorEl);

      let currentTableEl: HTMLElement | null = null;
      let currentGridMetrics: TableGridMetrics | null = null;
      let hoverState = createEmptyHoverState();
      let isRowResizing = false;
      let rowControlsEl: HTMLElement | null = null;
      let colControlsEl: HTMLElement | null = null;
      let guidesEl: HTMLElement | null = null;
      let toolbarEl: HTMLElement | null = null;
      let resizeHandleEl: HTMLElement | null = null;

      const remove = () => {
        rowControlsEl?.remove();
        colControlsEl?.remove();
        guidesEl?.remove();
        toolbarEl?.remove();
        resizeHandleEl?.remove();
        currentTableEl = null;
        currentGridMetrics = null;
        rowControlsEl = null;
        colControlsEl = null;
        guidesEl = null;
        toolbarEl = null;
        resizeHandleEl = null;
        document
          .querySelectorAll('.__pm-table-menu')
          .forEach((menuElement) => menuElement.remove());
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
          setPersistedRowHeight(
            view,
            tableNode,
            tablePos,
            rowIndex,
            currentHeight,
          );
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };

      const render = (view: EditorView) => {
        remove();

        const tableInfo = findTable(view.state);
        if (!tableInfo) return;

        const tableDomInfo = getTableDomInfo(view, tableInfo.pos);
        if (!tableDomInfo) return;

        currentTableEl = tableDomInfo.tableEl;
        applyTableWidth(tableInfo.node, tableDomInfo.tableEl);
        applyRowHeights(tableInfo.node, tableDomInfo.tableEl);
        const gridMetrics = getTableGridMetrics(
          tableInfo.node,
          tableDomInfo.tableEl,
        );
        currentGridMetrics = gridMetrics;
        const selectedMarkers = getSelectedMarkerState(
          view.state,
          tableInfo.node,
          tableInfo.pos,
        );

        rowControlsEl = buildRowControls(
          view,
          tableInfo.node,
          tableInfo.pos,
          tableDomInfo.tableEl,
          container,
          hoverState.rowIndex ?? selectedMarkers.rowIndex,
          hoverState.rowMarkerIndex ?? selectedMarkers.rowIndex,
        );
        colControlsEl = buildColControls(
          view,
          tableInfo.node,
          tableInfo.pos,
          tableDomInfo.tableEl,
          container,
          hoverState.colIndex ?? selectedMarkers.colIndex,
          hoverState.colMarkerIndex ?? selectedMarkers.colIndex,
          gridMetrics,
        );
        guidesEl = buildBoundaryGuides(
          view,
          tableInfo.node,
          tableInfo.pos,
          tableDomInfo.tableEl,
          container,
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
        toolbarEl = buildFloatingToolbar(view, tableDomInfo.tableEl, container);
        resizeHandleEl = buildTableResizeHandle(
          view,
          tableInfo.node,
          tableInfo.pos,
          tableDomInfo.tableEl,
          container,
        );

        container.appendChild(rowControlsEl);
        container.appendChild(colControlsEl);
        container.appendChild(guidesEl);
        container.appendChild(toolbarEl);
        container.appendChild(resizeHandleEl);
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

        if (
          target.closest('.__pm-table-toolbar') ||
          target.closest('.__pm-table-resize-handle') ||
          target.closest('.__pm-table-menu')
        ) {
          return;
        }

        const rowMarker = target.closest('[data-table-row-marker]') as
          | HTMLElement
          | null;
        if (rowMarker) {
          updateHoverState({
            ...createEmptyHoverState(),
            rowIndex: Number(rowMarker.dataset['tableRowMarker']),
            rowMarkerIndex: Number(rowMarker.dataset['tableRowMarker']),
          });
          return;
        }

        const colMarker = target.closest('[data-table-col-marker]') as
          | HTMLElement
          | null;
        if (colMarker) {
          updateHoverState({
            ...createEmptyHoverState(),
            colIndex: Number(colMarker.dataset['tableColMarker']),
            colMarkerIndex: Number(colMarker.dataset['tableColMarker']),
          });
          return;
        }

        if (
          !currentTableEl ||
          !currentGridMetrics ||
          !currentTableEl.contains(target)
        ) {
          clearHoverState();
          return;
        }

        updateHoverState(
          getHoverStateFromTableEvent(event, currentTableEl, currentGridMetrics),
        );
      };

      const handleExternalLayout = () => {
        render(editorView);
      };

      container.addEventListener('mousemove', handlePointerMove);
      container.addEventListener('mouseleave', clearHoverState);
      window.addEventListener('resize', handleExternalLayout);
      window.addEventListener('scroll', handleExternalLayout, true);
      container.addEventListener('scroll', handleExternalLayout, true);

      render(editorView);

      return {
        update(view: EditorView) {
          render(view);
        },
        destroy() {
          remove();
          container.removeEventListener('mousemove', handlePointerMove);
          container.removeEventListener('mouseleave', clearHoverState);
          window.removeEventListener('resize', handleExternalLayout);
          window.removeEventListener('scroll', handleExternalLayout, true);
          container.removeEventListener('scroll', handleExternalLayout, true);
        },
      };
    },
  });
}
