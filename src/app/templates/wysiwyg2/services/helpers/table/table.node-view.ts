import { Node } from 'prosemirror-model';
import {
  addColumnAfter,
  addRowAfter,
  deleteTable,
  mergeCells,
  splitCell,
  toggleHeaderRow,
} from 'prosemirror-tables';
import { EditorView, ViewMutationRecord } from 'prosemirror-view';

const MIN_TABLE_WIDTH = 240;

export function tableNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;

  // ═══════════════════════════════════════════════════════════════
  // Build the full Confluence-style wrapper hierarchy
  // ═══════════════════════════════════════════════════════════════

  // .tableView-content-wrap  (outermost — returned as `dom`)
  const tableViewContentWrap = document.createElement('div');
  tableViewContentWrap.className = 'tableView-content-wrap';

  // .table-alignment-container
  const alignmentContainer = document.createElement('div');
  alignmentContainer.className = 'table-alignment-container';
  alignmentContainer.setAttribute('data-testid', 'table-alignment-container');
  alignmentContainer.style.cssText = 'display: flex; justify-content: flex-start;';
  tableViewContentWrap.appendChild(alignmentContainer);

  // .pm-table-resizer-container
  const resizerContainer = document.createElement('div');
  resizerContainer.className = 'pm-table-resizer-container';
  resizerContainer.style.cssText =
    '--ak-editor-table-gutter-padding: calc(var(--ak-editor--large-gutter-padding, 20px) * 2);' +
    'width: var(--ak-editor-table-width, 100%); height: auto; position: unset;';
  alignmentContainer.appendChild(resizerContainer);

  // .resizer-item.display-handle
  const resizerItem = document.createElement('div');
  resizerItem.className = 'resizer-item display-handle';
  resizerItem.setAttribute('data-vc-nvs', 'true');
  resizerItem.style.cssText =
    'position: relative; user-select: auto; box-sizing: border-box;';
  resizerContainer.appendChild(resizerItem);

  // span.resizer-hover-zone
  const resizerHoverZone = document.createElement('span');
  resizerHoverZone.className = 'resizer-hover-zone';
  resizerItem.appendChild(resizerHoverZone);

  // .pm-table-container.pm-table-with-controls
  const pmTableContainer = document.createElement('div');
  pmTableContainer.className = 'pm-table-container pm-table-with-controls';
  pmTableContainer.setAttribute('data-number-column', 'false');
  pmTableContainer.setAttribute('data-layout', 'align-start');
  pmTableContainer.setAttribute('data-testid', 'table-container');
  pmTableContainer.style.position = 'relative';
  resizerHoverZone.appendChild(pmTableContainer);

  // ── Sentinel elements (top) ─────────────────────────────────
  const stickyTopSentinel = document.createElement('div');
  stickyTopSentinel.className = 'pm-table-sticky-sentinel-top';
  stickyTopSentinel.setAttribute('data-testid', 'sticky-sentinel-top');
  pmTableContainer.appendChild(stickyTopSentinel);

  const stickyScrollbarTopSentinel = document.createElement('div');
  stickyScrollbarTopSentinel.className = 'pm-table-sticky-scrollbar-sentinel-top';
  stickyScrollbarTopSentinel.setAttribute(
    'data-testid',
    'sticky-scrollbar-sentinel-top',
  );
  pmTableContainer.appendChild(stickyScrollbarTopSentinel);

  // ── Row controls placeholder ────────────────────────────────
  // Absolutely positioned to the left of the table area.
  const rowControlsWrapper = document.createElement('div');
  rowControlsWrapper.className = 'pm-table-drag-row-controls-wrapper';
  rowControlsWrapper.contentEditable = 'false';
  rowControlsWrapper.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    pointer-events: none;
  `;

  const rowControlsNone = document.createElement('div');
  rowControlsNone.setAttribute('role', 'none');

  const rowControls = document.createElement('div');
  rowControls.className = 'pm-table-drag-row-controls';
  rowControls.contentEditable = 'false';

  rowControlsNone.appendChild(rowControls);
  rowControlsWrapper.appendChild(rowControlsNone);
  pmTableContainer.appendChild(rowControlsWrapper);

  // ── .pm-table-wrapper (scrollable area, parent of <table>) ──
  const pmTableWrapper = document.createElement('div');
  pmTableWrapper.className = 'pm-table-wrapper';
  pmTableWrapper.setAttribute('data-auto-scrollable', 'true');
  pmTableWrapper.style.position = 'relative';
  pmTableContainer.appendChild(pmTableWrapper);

  // <table> — ProseMirror contentDOM
  const table = document.createElement('table');
  table.setAttribute('data-number-column', 'false');
  table.setAttribute('data-layout', 'align-start');
  table.setAttribute('data-autosize', 'false');
  table.style.cssText =
    'border-collapse: collapse; width: 100%; table-layout: fixed; box-sizing: border-box;';
  pmTableWrapper.appendChild(table);

  // ── Column controls placeholder (inside .pm-table-wrapper) ──
  // Absolutely positioned above the table.
  const colControlsWrapper = document.createElement('div');
  colControlsWrapper.className = 'pm-table-col-controls-wrapper';
  colControlsWrapper.contentEditable = 'false';
  colControlsWrapper.setAttribute(
    'data-testid',
    'table-floating-column-controls-wrapper',
  );
  colControlsWrapper.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    pointer-events: none;
  `;

  const colControlsDrag = document.createElement('div');
  colControlsDrag.className = 'pm-table-drag-column-controls';

  const colControlsInner = document.createElement('div');
  colControlsInner.className = 'pm-table-col-controls__inner';
  colControlsInner.setAttribute(
    'data-testid',
    'table-floating-column-controls',
  );

  colControlsDrag.appendChild(colControlsInner);
  colControlsWrapper.appendChild(colControlsDrag);
  pmTableWrapper.appendChild(colControlsWrapper);

  // ── Sentinel / scrollbar elements (bottom) ──────────────────
  const stickyScrollbarContainer = document.createElement('div');
  stickyScrollbarContainer.className = 'pm-table-sticky-scrollbar-container';
  stickyScrollbarContainer.setAttribute('data-vc-nvs', 'true');
  stickyScrollbarContainer.style.cssText =
    'height: var(--ds-space-250, 20px); display: none; width: 100%;';
  const stickyScrollbarInner = document.createElement('div');
  stickyScrollbarInner.setAttribute('data-vc-nvs', 'true');
  stickyScrollbarInner.style.cssText = 'height: 100%;';
  stickyScrollbarContainer.appendChild(stickyScrollbarInner);
  pmTableContainer.appendChild(stickyScrollbarContainer);

  const stickyBottomSentinel = document.createElement('div');
  stickyBottomSentinel.className = 'pm-table-sticky-sentinel-bottom';
  stickyBottomSentinel.setAttribute('data-testid', 'sticky-sentinel-bottom');
  pmTableContainer.appendChild(stickyBottomSentinel);

  const stickyScrollbarBottomSentinel = document.createElement('div');
  stickyScrollbarBottomSentinel.className =
    'pm-table-sticky-scrollbar-sentinel-bottom';
  stickyScrollbarBottomSentinel.setAttribute(
    'data-testid',
    'sticky-scrollbar-sentinel-bottom',
  );
  pmTableContainer.appendChild(stickyScrollbarBottomSentinel);

  // ── Border elements ─────────────────────────────────────────
  const leftBorder = document.createElement('div');
  leftBorder.className = 'pm-table-left-border';
  leftBorder.contentEditable = 'false';
  leftBorder.setAttribute('data-with-numbered-table', 'false');
  leftBorder.setAttribute('data-testid', 'table-left-border');
  pmTableContainer.appendChild(leftBorder);

  const rightBorder = document.createElement('div');
  rightBorder.className = 'pm-table-right-border';
  rightBorder.contentEditable = 'false';
  rightBorder.setAttribute('data-testid', 'table-right-border');
  pmTableContainer.appendChild(rightBorder);

  // ═══════════════════════════════════════════════════════════════
  // Right-edge resize handle (.resizer-handle-wrapper)
  // Sibling to .resizer-hover-zone, inside .resizer-item
  // ═══════════════════════════════════════════════════════════════
  const resizeHandleWrapper = document.createElement('span');
  resizeHandleWrapper.className = 'resizer-handle-wrapper';

  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resizer-handle right large sticky';
  resizeHandle.style.cssText = `
    position: absolute;
    user-select: none;
    width: var(--ds-space-100, 8px);
    height: 100%;
    top: 0px;
    right: -14px;
    cursor: col-resize;
    z-index: 1;
    pointer-events: auto;
    align-items: center;
    margin-top: var(--ds-space-150, 12px);
  `;

  const resizeInnerWrapper = document.createElement('div');
  resizeInnerWrapper.contentEditable = 'false';
  resizeInnerWrapper.style.cssText = `
    position: inherit; height: inherit; width: inherit;
    display: inherit; flex-direction: inherit;
    justify-content: inherit; align-items: inherit;
  `;

  const resizeTooltipContainer = document.createElement('div');
  resizeTooltipContainer.setAttribute(
    'data-testid',
    'resizer-handle-right-tooltip--container',
  );
  resizeTooltipContainer.setAttribute('role', 'presentation');

  const resizeHandleThumb = document.createElement('button');
  resizeHandleThumb.className = 'resizer-handle-thumb';
  resizeHandleThumb.setAttribute('data-testid', 'resizer-handle-right-thumb');
  resizeHandleThumb.setAttribute('aria-label', 'Resize handle');
  resizeHandleThumb.contentEditable = 'false';
  resizeHandleThumb.type = 'button';
  resizeHandleThumb.tabIndex = -1;

  const resizeHandleTrack = document.createElement('div');
  resizeHandleTrack.className = 'resizer-handle-track shadow';
  resizeHandleTrack.setAttribute('data-testid', 'resizer-handle-right-track');

  resizeTooltipContainer.appendChild(resizeHandleThumb);
  resizeTooltipContainer.appendChild(resizeHandleTrack);
  resizeInnerWrapper.appendChild(resizeTooltipContainer);
  resizeHandle.appendChild(resizeInnerWrapper);
  resizeHandleWrapper.appendChild(resizeHandle);
  resizerItem.appendChild(resizeHandleWrapper);

  // .__resizable_base__
  const resizableBase = document.createElement('div');
  resizableBase.className = '__resizable_base__';
  resizableBase.style.cssText =
    'width: 100%; height: 100%; position: absolute; transform: scale(0, 0); left: 0px; flex: 0 1 0%;';
  resizerContainer.appendChild(resizableBase);

  // ── Resize handle interactions ──────────────────────────────
  resizeHandle.addEventListener('mouseenter', () => {
    resizeHandleTrack.style.background = '#0052CC';
    resizeHandleThumb.style.background = '#4688EC';
  });
  resizeHandle.addEventListener('mouseleave', () => {
    resizeHandleTrack.style.background = 'transparent';
    resizeHandleThumb.style.background = 'transparent';
  });

  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = table.offsetWidth;

    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.max(MIN_TABLE_WIDTH, startWidth + ev.clientX - startX);
      table.style.width = `${Math.round(newWidth)}px`;
      table.style.maxWidth = 'none';
    };
    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Persist width to PM document attrs
      const pos = getPos();
      if (pos == null) return;
      const tableNode = view.state.doc.nodeAt(pos);
      if (!tableNode) return;
      const finalWidth = Math.max(
        MIN_TABLE_WIDTH,
        Math.round(startWidth + ev.clientX - startX),
      );
      if (tableNode.attrs['width'] === finalWidth) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...tableNode.attrs,
          width: finalWidth,
        }),
      );
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // ═══════════════════════════════════════════════════════════════
  // Floating toolbar (below the table, inside .pm-table-container)
  // ═══════════════════════════════════════════════════════════════
  const toolbar = buildTableToolbar(view, getPos);
  pmTableContainer.appendChild(toolbar);

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  tableViewContentWrap.addEventListener('focusin', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    toolbar.style.display = 'inline-flex';
  });

  tableViewContentWrap.addEventListener('focusout', (e) => {
    if (tableViewContentWrap.contains(e.relatedTarget as HTMLElement)) return;
    hideTimer = setTimeout(() => {
      toolbar.style.display = 'none';
      hideTimer = null;
    }, 100);
  });

  // ═══════════════════════════════════════════════════════════════
  // ProseMirror NodeView return
  // ═══════════════════════════════════════════════════════════════
  return {
    dom: tableViewContentWrap,
    contentDOM: table,

    update(updatedNode: Node) {
      return updatedNode.type === nodeType;
    },

    ignoreMutation(mutation: ViewMutationRecord) {
      const target = mutation.target as HTMLElement;

      // Ignore ALL mutations outside the <table> (wrapper elements,
      // controls, toolbar, resize handle, sentinels, borders …)
      if (target !== table && !table.contains(target)) {
        return true;
      }

      // Ignore colgroup mutations added by the columnResizing() plugin
      if (
        mutation.target === table &&
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(
          (n) => (n as HTMLElement).tagName === 'COLGROUP',
        )
      ) {
        return true;
      }

      // Ignore table-level style / attribute mutations (width changes etc.)
      if (mutation.type === 'attributes' && target === table) {
        return true;
      }

      return false;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Toolbar builder
// ═══════════════════════════════════════════════════════════════════

function buildTableToolbar(
  view: EditorView,
  getPos: () => number | undefined,
): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.className = '__pm-table-toolbar';
  toolbar.contentEditable = 'false';
  toolbar.style.cssText = `
    display: none;
    position: absolute;
    bottom: -44px;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: #ffffff;
    border: 1px solid #dfe1e6;
    border-radius: 8px;
    box-shadow: 0 8px 18px rgba(9, 30, 66, 0.15);
    z-index: 20;
    white-space: nowrap;
  `;

  const makeBtn = (
    label: string,
    onMouseDown: (e: MouseEvent) => void,
    extraStyle = '',
  ) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.cssText = `
      background: none; border: none; color: #172b4d;
      padding: 6px 10px; border-radius: 6px; cursor: pointer;
      font-size: 13px; ${extraStyle}
    `;
    btn.addEventListener('mouseenter', () => (btn.style.background = '#f1f2f4'));
    btn.addEventListener('mouseleave', () => (btn.style.background = 'transparent'));
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onMouseDown(e);
    });
    return btn;
  };

  const sep = () => {
    const d = document.createElement('div');
    d.style.cssText = 'width:1px;height:22px;background:#DFE1E6;';
    return d;
  };

  // ── Table options ───────────────────────────────────────────
  const tableOptionsBtn = makeBtn('Table options', () => {
    const items = [
      {
        label: 'Toggle header row',
        action: () => {
          toggleHeaderRow(view.state, view.dispatch);
          view.focus();
        },
      },
      {
        label: 'Merge selected cells',
        action: () => {
          mergeCells(view.state, view.dispatch);
          view.focus();
        },
      },
      {
        label: 'Split selected cell',
        action: () => {
          splitCell(view.state, view.dispatch);
          view.focus();
        },
      },
      { separator: true, label: '', action: () => {} },
      {
        label: 'Delete table',
        danger: true,
        action: () => {
          deleteTable(view.state, view.dispatch);
          view.focus();
        },
      },
    ];
    const rect = tableOptionsBtn.getBoundingClientRect();
    showQuickMenu(items, rect.left, rect.bottom + 6);
  });

  toolbar.appendChild(tableOptionsBtn);
  toolbar.appendChild(sep());

  // ── Add row ─────────────────────────────────────────────────
  toolbar.appendChild(
    makeBtn('Add row', () => {
      addRowAfter(view.state, view.dispatch);
      view.focus();
    }),
  );

  // ── Add column ──────────────────────────────────────────────
  toolbar.appendChild(
    makeBtn('Add column', () => {
      addColumnAfter(view.state, view.dispatch);
      view.focus();
    }),
  );

  toolbar.appendChild(sep());

  // ── Delete table ────────────────────────────────────────────
  toolbar.appendChild(
    makeBtn(
      'Delete',
      () => {
        const pos = getPos();
        if (pos == null) return;
        const n = view.state.doc.nodeAt(pos);
        if (!n) return;
        view.dispatch(view.state.tr.delete(pos, pos + n.nodeSize));
      },
      'color: #de350b;',
    ),
  );

  return toolbar;
}

// ── Lightweight quick-menu (used by toolbar table-options) ────

function showQuickMenu(
  items: Array<{
    label: string;
    action: () => void;
    danger?: boolean;
    separator?: boolean;
  }>,
  x: number,
  y: number,
) {
  const menu = document.createElement('div');
  menu.className = '__pm-table-menu';
  menu.style.cssText = `
    position: fixed;
    background: #ffffff; border: 1px solid #dfe1e6; border-radius: 4px;
    padding: 4px 0; min-width: 200px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 9999;
  `;

  for (const item of items) {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px; background:#dfe1e6; margin:4px 0;';
      menu.appendChild(sep);
      continue;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.style.cssText = `
      display: flex; align-items: center; width: 100%;
      padding: 7px 12px; background: none; border: none; cursor: pointer;
      font-size: 14px; text-align: left;
      color: ${item.danger ? '#de350b' : '#172b4d'};
    `;
    btn.addEventListener('mouseenter', () => (btn.style.background = '#f1f2f4'));
    btn.addEventListener('mouseleave', () => (btn.style.background = 'none'));
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.action();
      menu.remove();
    });
    menu.appendChild(btn);
  }

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;

  const close = (e: MouseEvent) => {
    if (!menu.contains(e.target as HTMLElement)) {
      menu.remove();
      document.removeEventListener('mousedown', close);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', close), 0);
}
