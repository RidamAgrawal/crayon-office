import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export function codeBlockNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  let currentCode = node.textContent;

  // ── Outer wrapper ──────────────────────────────────────────
  const outer = document.createElement('div');
  outer.className = 'cm-editor code-block';
  outer.setAttribute('data-prosemirror-content-type', 'node');
  outer.setAttribute('data-prosemirror-node-name', 'codeBlock');
  outer.setAttribute('data-prosemirror-node-block', 'true');
  outer.contentEditable = 'false';
  outer.style.cssText = `
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
    background: #FFFFFF;
    border-radius: 3px;
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: .875rem;
    line-height: 1.5rem;
    min-width: 48px;
    cursor: pointer;
    clear: both;
    white-space: normal;
  `;

  // ── Scroller (gutters + content side by side) ──────────────
  const scroller = document.createElement('div');
  scroller.className = 'cm-scroller';
  scroller.style.cssText = `
    display: flex;
    align-items: flex-start;
    height: 100%;
    overflow-x: auto;
    position: relative;
    z-index: 0;
    overflow-anchor: none;
    background-color: #0515240F;
    line-height: unset;
    border-radius: 4px;
    background-image: linear-gradient(to right, #0515240F 24px, transparent 24px), linear-gradient(to right, #FFFFFF 24px, transparent 24px), linear-gradient(to left, #0515240F 8px, transparent 8px), linear-gradient(to left, #FFFFFF 8px, transparent 8px), linear-gradient(to left, #1E1F2129 0, transparent 8px), linear-gradient(to left, #1E1F211f 0, transparent 8px), linear-gradient(to right, #1E1F2129) 0, transparent 8px), linear-gradient(to right,  #1E1F211f 0, transparent 8px);
    background-attachment: local, local, local, local, scroll, scroll, scroll, scroll;
  `;
  outer.appendChild(scroller);

  const toolbar = codeBlockToolbar(view, node, getPos);
  outer.appendChild(toolbar);

  // ── Gutters (line numbers) ─────────────────────────────────
  const gutters = document.createElement('div');
  gutters.className = 'cm-gutters';
  gutters.setAttribute('aria-hidden', 'true');
  gutters.style.cssText = `
          flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    inset-inline-start: 0;
    z-index: 200;
    background-color: #0515240F;
    border: none;
    padding: 0;
    color: #6B6E76;
    min-height: 64px;
  `;
  scroller.appendChild(gutters);

  const guttersContainer = document.createElement('div');
  guttersContainer.classList.add('cm-gutter');
  guttersContainer.classList.add('cm-lineNumbers');
  guttersContainer.style.cssText = `
          padding: 8px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-sizing: border-box;
          min-height: 100%;
          overflow: hidden;
          `;
  gutters.appendChild(guttersContainer);

  // ── Content area (textarea) ────────────────────────────────
  const content = document.createElement('div');
  content.className = 'cm-content';
  content.style.cssText = `
    flex: 1;
    position: relative;
    overflow: hidden;
  `;
  scroller.appendChild(content);

  const textarea = document.createElement('textarea');
  textarea.className = 'cm-textarea';
  textarea.setAttribute('aria-label', 'Code snippet');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('spellcheck', 'false');
  textarea.value = currentCode;
  textarea.style.cssText = `
          tab-size: 4;
          -webkit-user-modify: read-write-plaintext-only;
          cursor: text;
          caret-color: #292A2E;

          flex-grow: 2;
          flex-shrink: 0;
          display: block;
          white-space: pre;
          word-wrap: normal;
          box-sizing: border-box;
          min-height: 100%;
          outline: none;
          margin: 8px;

          display: block;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: inherit;
          font-size: inherit;
          line-height: 1.5rem;
          white-space: pre;
          overflow: hidden;
          box-sizing: border-box;
        `;
  content.appendChild(textarea);

  // ── Line number helpers ────────────────────────────────────
  const updateLineNumbers = (code: string) => {
    const lineCount = code.split('\n').length;
    guttersContainer.innerHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      const el = document.createElement('div');
      el.className = 'cm-gutterElement';
      el.style.cssText = `min-height: 1.5rem; padding: 0 3px 0 5px; text-align: right; white-space: nowrap; box-sizing: border-box;`;
      el.textContent = String(i);
      guttersContainer.appendChild(el);
    }
  };

  const autoResize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  updateLineNumbers(currentCode);

  // ── Sync textarea → ProseMirror ────────────────────────────
  textarea.addEventListener('input', () => {
    currentCode = textarea.value;
    updateLineNumbers(currentCode);
    autoResize();

    const pos = getPos();
    if (pos == null) return;

    const start = pos + 1; // inside the node
    const end = pos + 1 + view.state.doc.nodeAt(pos)!.content.size;

    view.dispatch(
      view.state.tr.replaceWith(
        start,
        end,
        currentCode ? view.state.schema.text(currentCode) : [],
      ),
    );
  });

  // Tab key → insert spaces instead of focusing next element
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value =
        textarea.value.substring(0, start) +
        '    ' +
        textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
      textarea.dispatchEvent(new Event('input'));
    }

    // Escape → return focus to ProseMirror
    if (e.key === 'Escape') {
      view.focus();
    }
  });

  // Prevent ProseMirror from stealing clicks inside the editor
  textarea.addEventListener('mousedown', (e) => e.stopPropagation());
  textarea.addEventListener('click', (e) => e.stopPropagation());
  // ── Show/hide toolbar on textarea focus/blur ─────────────
  textarea.addEventListener('focus', () => {
    toolbar.style.display = 'flex';
  });
  textarea.addEventListener('blur', (e) => {
    // Don't hide if user clicked inside the toolbar
    if (toolbar.contains(e.relatedTarget as HTMLElement)) return;
    toolbar.style.display = 'none';
  });

  // ── nodeView return ────────────────────────────────────────
  return {
    dom: outer,
    // No contentDOM — we manage content ourselves via the textarea
    update(updatedNode: Node) {
      if (updatedNode.type !== node.type) return false;

      // Only update textarea if content changed externally (undo/redo/collab)
      const newCode = updatedNode.textContent;
      if (newCode !== currentCode) {
        currentCode = newCode;
        textarea.value = currentCode;
        updateLineNumbers(currentCode);
        autoResize();
      }
      return true;
    },
    stopEvent(e: Event) {
      // Let all events inside the textarea be handled natively
      return e.target === textarea;
    },
    ignoreMutation() {
      // We manage DOM ourselves — ignore all mutations
      return true;
    },
  };
}

function codeBlockToolbar(
  view: EditorView,
  node: Node,
  getPos: () => number | undefined,
) {
  const toolbar = document.createElement('div');
  toolbar.className = 'code-block-toolbar';
  toolbar.contentEditable = 'false';
  toolbar.style.cssText = `
  display: none;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  justify-content: flex-end;
`;
  // Language selector
  const langSelect = document.createElement('select');
  langSelect.className = 'code-lang-select';
  langSelect.style.cssText = `
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.8rem;
  background: #fff;
  cursor: pointer;
  outline: none;
`;
  const languages = [
    '',
    'javascript',
    'typescript',
    'python',
    'java',
    'css',
    'html',
    'json',
    'bash',
    'sql',
  ];
  languages.forEach((lang) => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang || 'Select language';
    if (lang === (node.attrs['language'] || '')) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener('change', () => {
    const pos = getPos();
    if (pos == null) return;
    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        language: langSelect.value || null,
      }),
    );
  });
  toolbar.appendChild(langSelect);
  // Wrap toggle button
  const wrapBtn = document.createElement('button');
  wrapBtn.className = 'code-wrap-btn';
  wrapBtn.title = 'Toggle word wrap';
  wrapBtn.innerHTML = '⇋';
  wrapBtn.style.cssText = `
  padding: 4px 8px; border: 1px solid #ddd;
  border-radius: 3px; background: #fff; cursor: pointer;
`;
  let isWrapped = false;
  wrapBtn.addEventListener('click', () => {
    isWrapped = !isWrapped;
    // textarea.style.whiteSpace = isWrapped ? 'pre-wrap' : 'pre';
    // textarea.style.wordWrap = isWrapped ? 'break-word' : 'normal';
  });
  toolbar.appendChild(wrapBtn);
  // "More" button
  const moreBtn = document.createElement('button');
  moreBtn.className = 'code-more-btn';
  moreBtn.title = 'More options';
  moreBtn.innerHTML = '⋯';
  moreBtn.style.cssText = `
  padding: 4px 8px; border: 1px solid #ddd;
  border-radius: 3px; background: #fff; cursor: pointer;
`;
  toolbar.appendChild(moreBtn);
  // Prevent toolbar clicks from stealing textarea focus
  toolbar.addEventListener('mousedown', (e) => e.preventDefault());

  return toolbar;
}
/*
  private codeBlockToolbarPlugin() {
    const codeBlockToolbarKey = new PluginKey('codeBlockToolbar');
    return new Plugin({
      key: codeBlockToolbarKey,
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, decorations, oldState, newState) {
          const { $from } = newState.selection;
          if ($from.parent.type.name === 'code_block') {
            const endOfBlock = $from.end($from.depth);
            const widget = Decoration.widget(
              endOfBlock,
              () => {
                const toolbar = document.createElement('div');
                toolbar.className = 'code-block-toolbar';
                toolbar.innerHTML = ` your toolbar HTML `;
                return toolbar;
              },
              { side: 1 },
            );
            return DecorationSet.create(newState.doc, [widget]);
          }
          return DecorationSet.empty;
        },
      },
      props: {
        decorations(state) {
          return codeBlockToolbarKey.getState(state);
        },
      },
    });
  }
  */
