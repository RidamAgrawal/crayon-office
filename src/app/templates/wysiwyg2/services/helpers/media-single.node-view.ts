import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

const MIN_WIDTH = 24;

const LAYOUTS = [
  {
    key: 'start',
    title: 'Align left',
    justify: 'flex-start',
    svg: `<rect x="1" y="2" width="6" height="5" rx="1" fill="currentColor"/>
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="1" y="11.5" width="11" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="1" y="14" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>`,
  },
  {
    key: 'center',
    title: 'Center',
    justify: 'center',
    svg: `<rect x="4" y="2" width="8" height="5" rx="1" fill="currentColor"/>
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="1" y="14" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>`,
  },
  {
    key: 'end',
    title: 'Align right',
    justify: 'flex-end',
    svg: `<rect x="9" y="2" width="6" height="5" rx="1" fill="currentColor"/>
          <rect x="1" y="9" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="4" y="11.5" width="11" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
          <rect x="1" y="14" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>`,
  },
] as const;

export function mediaSingleNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  const nodeType = node.type;

  // ── Outer wrapper ────────────────────────────────────────────
  const outer = document.createElement('div');
  outer.className = 'mediaSingleView-content-wrap';
  outer.setAttribute('data-node-type', 'mediaSingle');
  outer.setAttribute('data-prosemirror-content-type', 'node');
  outer.setAttribute('data-prosemirror-node-name', 'media_single');
  outer.setAttribute('data-prosemirror-node-block', 'true');
  outer.setAttribute('draggable', 'true');
  outer.style.cssText = `
    position: relative;
    display: flex;
    justify-content: ${LAYOUTS.find((l) => l.key === (node.attrs['layout'] || 'center'))?.justify ?? 'center'};
    margin: 8px 0;
    user-select: none;
    padding: 0 1px;
  `;

  // ── Inner resizable container ─────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'resizer-item display-handle';
  inner.style.cssText = `
    position: relative;
    box-sizing: border-box;
    display: inline-block;
    max-width: 100%;
    line-height: 0;
  `;
  const initWidth = node.attrs['width'];
  if (initWidth) inner.style.width = `${initWidth}px`;
  outer.appendChild(inner);

  // ── Hover zone → figure → img ────────────────────────────────
  const hoverZone = document.createElement('span');
  hoverZone.className = 'resizer-hover-zone resizer-is-extended';
  inner.appendChild(hoverZone);

  const figure = document.createElement('figure');
  figure.className = 'media-single-node';
  figure.style.cssText = 'margin: 0; padding: 0; line-height: 0; display: block;';
  hoverZone.appendChild(figure);

  const img = document.createElement('img');
  img.src = node.attrs['src'] || '';
  img.alt = node.attrs['alt'] || '';
  img.draggable = false;
  img.style.cssText = `
    display: block;
    width: 100%;
    height: auto;
    border-radius: 2px;
    pointer-events: none;
  `;
  figure.appendChild(img);

  // ── Resize handle builder ─────────────────────────────────────
  const makeHandle = (side: 'left' | 'right') => {
    const handle = document.createElement('div');
    handle.className = `resizer-handle ${side} medium center`;
    handle.style.cssText = `
      position: absolute;
      user-select: none;
      width: 24px;
      height: 100%;
      top: 0;
      ${side}: -20px;
      cursor: col-resize;
      z-index: 1;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const innerDiv = document.createElement('div');
    innerDiv.contentEditable = 'false';
    innerDiv.style.cssText = `
      position: inherit; height: inherit; width: inherit;
      display: inherit; flex-direction: inherit;
      justify-content: inherit; align-items: inherit;
    `;

    const thumb = document.createElement('button');
    thumb.className = 'resizer-handle-thumb';
    thumb.setAttribute('data-testid', `resizer-handle-${side}-thumb`);
    thumb.setAttribute('aria-label', 'Resize handle');
    thumb.contentEditable = 'false';
    thumb.type = 'button';
    thumb.tabIndex = -1;
    thumb.style.cssText = `
      width: 4px; height: 24px;
      background: transparent;
      border: none; border-radius: 2px;
      cursor: col-resize; padding: 0;
      transition: background 0.15s;
      pointer-events: none;
      flex-shrink: 0;
    `;

    const track = document.createElement('div');
    track.className = 'resizer-handle-track full-height';
    track.setAttribute('data-testid', `resizer-handle-${side}-track`);
    track.style.cssText = `
      position: absolute;
      width: 2px; height: 100%;
      background: transparent;
      border-radius: 1px;
      transition: background 0.15s;
      pointer-events: none;
    `;

    innerDiv.appendChild(thumb);
    innerDiv.appendChild(track);
    handle.appendChild(innerDiv);

    handle.addEventListener('mouseenter', () => {
      if (!handle.dataset['resizing']) {
        thumb.style.background = '#0052CC';
        track.style.background = 'rgba(0,82,204,0.15)';
      }
    });
    handle.addEventListener('mouseleave', () => {
      if (!handle.dataset['resizing']) {
        thumb.style.background = 'transparent';
        track.style.background = 'transparent';
      }
    });

    return { handle, thumb, track };
  };

  // ── Resize handles ────────────────────────────────────────────
  const handleWrapper = document.createElement('span');
  handleWrapper.className = 'resizer-handle-wrapper';
  inner.appendChild(handleWrapper);

  const leftHandle = makeHandle('left');
  const rightHandle = makeHandle('right');
  handleWrapper.appendChild(leftHandle.handle);
  handleWrapper.appendChild(rightHandle.handle);

  // ── Dimensions tooltip (shown during drag) ────────────────────
  const tooltip = document.createElement('div');
  tooltip.className = 'resize-dimensions-tooltip';
  tooltip.style.cssText = `
    display: none;
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: #ffffff;
    border: 1px solid #DFE1E6;
    border-radius: 4px;
    padding: 4px 14px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    z-index: 30;
    color: #172B4D;
    line-height: 1.6;
  `;
  inner.appendChild(tooltip);

  // ── Resize logic ──────────────────────────────────────────────
  const attachResize = (handleEl: HTMLElement, dir: 'left' | 'right') => {
    handleEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      handleEl.dataset['resizing'] = 'true';
      const startX = e.clientX;
      const startWidth = inner.offsetWidth || img.naturalWidth || 300;
      tooltip.style.display = 'block';
      tooltip.textContent = `${Math.round(startWidth)} × ${Math.round(img.offsetHeight)}`;

      const getMaxWidth = () => {
        const pm = outer.closest('.ProseMirror') as HTMLElement | null;
        return pm?.offsetWidth ?? outer.parentElement?.offsetWidth ?? 800;
      };

      const onMove = (ev: MouseEvent) => {
        const delta = dir === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const newW = Math.max(MIN_WIDTH, Math.min(getMaxWidth(), startWidth + delta));
        inner.style.width = `${Math.round(newW)}px`;
        tooltip.textContent = `${Math.round(newW)} × ${Math.round(img.offsetHeight)}`;
      };

      const onUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        delete handleEl.dataset['resizing'];
        tooltip.style.display = 'none';

        // Restore handle colors
        const { thumb, track } = dir === 'left' ? leftHandle : rightHandle;
        thumb.style.background = 'transparent';
        track.style.background = 'transparent';

        const delta = dir === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const finalWidth = Math.max(
          MIN_WIDTH,
          Math.min(getMaxWidth(), Math.round(startWidth + delta)),
        );

        const pos = getPos();
        if (pos == null) return;
        const currentNode = view.state.doc.nodeAt(pos);
        if (!currentNode) return;
        if (currentNode.attrs['width'] === finalWidth) return;

        view.dispatch(
          view.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            width: finalWidth,
          }),
        );
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  };

  attachResize(leftHandle.handle, 'left');
  attachResize(rightHandle.handle, 'right');

  // ── Bottom toolbar (shown on selectNode) ──────────────────────
  const { toolbar, updateDims } = buildImageToolbar(
    view,
    getPos,
    img,
    inner,
    outer,
    node.attrs['layout'] || 'center',
  );
  outer.appendChild(toolbar);

  // ── ProseMirror NodeView ──────────────────────────────────────
  return {
    dom: outer,

    selectNode() {
      outer.classList.add('ak-editor-selected-node');
      inner.style.outline = '2px solid #0052CC';
      inner.style.outlineOffset = '2px';
      inner.style.borderRadius = '2px';
      toolbar.style.display = 'inline-flex';
      updateDims();
    },

    deselectNode() {
      outer.classList.remove('ak-editor-selected-node');
      inner.style.outline = '';
      inner.style.outlineOffset = '';
      inner.style.borderRadius = '';
      toolbar.style.display = 'none';
    },

    update(updatedNode: Node) {
      if (updatedNode.type !== nodeType) return false;
      img.src = updatedNode.attrs['src'] || '';
      img.alt = updatedNode.attrs['alt'] || '';
      const w = updatedNode.attrs['width'];
      inner.style.width = w ? `${w}px` : '';
      const layout = LAYOUTS.find((l) => l.key === (updatedNode.attrs['layout'] || 'center'));
      if (layout) outer.style.justifyContent = layout.justify;
      return true;
    },

    stopEvent(event: Event) {
      const target = event.target as HTMLElement;
      return !!(
        target.closest('.resizer-handle-wrapper') ||
        target.closest('.__pm-image-toolbar') ||
        target.closest('.__pm-image-alt-popup')
      );
    },

    ignoreMutation() {
      return true;
    },

    destroy() {},
  };
}

// ── Toolbar ───────────────────────────────────────────────────────

function buildImageToolbar(
  view: EditorView,
  getPos: () => number | undefined,
  img: HTMLImageElement,
  inner: HTMLElement,
  outer: HTMLElement,
  initialLayout: string,
): { toolbar: HTMLElement; updateDims: () => void } {
  const toolbar = document.createElement('div');
  toolbar.className = '__pm-image-toolbar';
  toolbar.contentEditable = 'false';
  toolbar.style.cssText = `
    display: none;
    position: absolute;
    bottom: -52px;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: #ffffff;
    border: 1px solid #DFE1E6;
    border-radius: 8px;
    box-shadow: 0 8px 18px rgba(9, 30, 66, 0.15);
    z-index: 20;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const sep = () => {
    const d = document.createElement('div');
    d.style.cssText = 'width:1px; height:20px; background:#DFE1E6; margin:0 4px; flex-shrink:0;';
    return d;
  };

  const makeIconBtn = (
    title: string,
    svgContent: string,
    onClick: () => void,
    active = false,
  ): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.dataset['active'] = active ? 'true' : '';
    btn.style.cssText = `
      background: ${active ? '#E9F2FE' : 'none'};
      border: none;
      padding: 5px 7px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${active ? '#1868db' : '#505258'};
      flex-shrink: 0;
      transition: background 0.1s, color 0.1s;
    `;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    btn.addEventListener('mouseenter', () => {
      if (!btn.dataset['active']) btn.style.background = '#0515240F';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = btn.dataset['active'] ? '#E9F2FF' : 'none';
    });
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  };

  const makeTextBtn = (label: string, onClick: () => void, danger = false): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.cssText = `
      background: none; border: none;
      padding: 5px 8px;
      cursor: pointer; border-radius: 4px;
      font-size: 13px;
      color: ${danger ? '#DE350B' : '#505258'};
      display: flex; align-items: center;
      flex-shrink: 0;
      transition: background 0.1s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = danger ? '#FFEBE6' : '#F1F2F4';
    });
    btn.addEventListener('mouseleave', () => (btn.style.background = 'none'));
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  };

  // ── Layout toggle buttons ─────────────────────────────────────
  const layoutBtns = LAYOUTS.map(({ key, title, svg, justify }) => {
    const isActive = key === initialLayout;
    const btn = makeIconBtn(
      title,
      svg,
      () => {
        outer.style.justifyContent = justify;
        layoutBtns.forEach((b) => {
          b.dataset['active'] = '';
          b.style.background = 'none';
          b.style.color = '#44546F';
        });
        btn.dataset['active'] = 'true';
        btn.style.background = '#E9F2FF';
        btn.style.color = '#0052CC';

        const pos = getPos();
        if (pos == null) return;
        const currentNode = view.state.doc.nodeAt(pos);
        if (!currentNode) return;
        view.dispatch(
          view.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            layout: key,
          }),
        );
      },
      isActive,
    );
    return btn;
  });

  // ── Live dimensions display ───────────────────────────────────
  const dimsEl = document.createElement('span');
  dimsEl.style.cssText = `
    font-size: 13px;
    color: #44546F;
    padding: 0 8px;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 80px;
    text-align: center;
    line-height: 1;
  `;

  const updateDims = () => {
    const w = inner.offsetWidth;
    const h = img.offsetHeight;
    dimsEl.textContent = w && h ? `${Math.round(w)} × ${Math.round(h)}` : '— × —';
  };
  img.addEventListener('load', updateDims);

  // ── Link button ───────────────────────────────────────────────
  const linkBtn = makeIconBtn(
    'Add link',
    `<path d="M6.5 9.5l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
     <path d="M8.414 11.414l-1.243 1.243a3 3 0 0 1-4.242-4.243L4.172 7.17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M7.586 4.586l1.242-1.243a3 3 0 0 1 4.243 4.243L11.828 8.83" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    () => {
      /* future: link dialog */
    },
  );

  // ── Edit alt text button + inline popover ─────────────────────
  let altEditing = false;

  const editAltBtn = makeTextBtn('Edit alt text', () => {
    if (altEditing) return;
    altEditing = true;

    const popup = document.createElement('div');
    popup.className = '__pm-image-alt-popup';
    popup.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      border: 1px solid #DFE1E6;
      border-radius: 6px;
      padding: 8px;
      box-shadow: 0 4px 14px rgba(9,30,66,0.2);
      z-index: 50;
      display: flex;
      gap: 6px;
      min-width: 280px;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = img.alt;
    input.placeholder = 'Describe this image…';
    input.style.cssText = `
      flex: 1;
      border: 1.5px solid #DFE1E6;
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 13px;
      outline: none;
      color: #172B4D;
      font-family: inherit;
    `;
    input.addEventListener('focus', () => (input.style.borderColor = '#0052CC'));
    input.addEventListener('blur', () => (input.style.borderColor = '#DFE1E6'));

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = `
      background: #0052CC; color: #fff;
      border: none; border-radius: 4px;
      padding: 5px 12px; font-size: 13px;
      cursor: pointer; flex-shrink: 0;
      font-family: inherit;
    `;

    const commit = () => {
      const newAlt = input.value.trim();
      img.alt = newAlt;
      popup.remove();
      altEditing = false;

      const pos = getPos();
      if (pos == null) return;
      const currentNode = view.state.doc.nodeAt(pos);
      if (!currentNode) return;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          ...currentNode.attrs,
          alt: newAlt,
        }),
      );
    };

    saveBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      commit();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      }
      if (e.key === 'Escape') {
        popup.remove();
        altEditing = false;
      }
      e.stopPropagation();
    });

    popup.appendChild(input);
    popup.appendChild(saveBtn);
    toolbar.appendChild(popup);
    requestAnimationFrame(() => input.focus());
  });

  // ── Copy button ───────────────────────────────────────────────
  const copyBtn = makeIconBtn(
    'Copy image URL',
    `<path d="M6 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
     <rect x="6" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>`,
    () => {
      navigator.clipboard?.writeText(img.src).catch(() => {});
    },
  );

  // ── Delete button ─────────────────────────────────────────────
  const deleteBtn = makeTextBtn(
    'Delete',
    () => {
      const pos = getPos();
      if (pos == null) return;
      const n = view.state.doc.nodeAt(pos);
      if (!n) return;
      view.dispatch(view.state.tr.delete(pos, pos + n.nodeSize));
    },
    true,
  );

  // ── Assemble ──────────────────────────────────────────────────
  layoutBtns.forEach((btn) => toolbar.appendChild(btn));
  toolbar.appendChild(sep());
  toolbar.appendChild(dimsEl);
  toolbar.appendChild(sep());
  toolbar.appendChild(linkBtn);
  toolbar.appendChild(editAltBtn);
  toolbar.appendChild(sep());
  toolbar.appendChild(copyBtn);
  toolbar.appendChild(deleteBtn);

  return { toolbar, updateDims };
}

/**
 * mediaSingleView-content-wrap          ← dom (outermost, position:relative flex)
 *   resizer-item.display-handle         ← width-controlled, inline-block
 *     span.resizer-hover-zone
 *       figure.media-single-node
 *         img
 *     span.resizer-handle-wrapper
 *       div.resizer-handle.left         ← left drag handle (-12px)
 *       div.resizer-handle.right        ← right drag handle (-12px)
 *     div.resize-dimensions-tooltip     ← shown during drag
 *   div.__pm-image-toolbar              ← shown on selectNode (bottom:-52px)
 */
