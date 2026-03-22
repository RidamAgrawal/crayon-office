import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export function taskItemNodeView(
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
) {
  // Outer container
  const outer = document.createElement('div');
  outer.classList.add('taskItemView-content-wrap');
  outer.style.cssText = `
            list-style: none;
            min-width: 48px;
            position: relative;
          `;
  outer.dataset['taskState'] = node.attrs['checked'] ? 'DONE' : 'TODO';
  outer.dataset['localId'] = node.attrs['localId'] || crypto.randomUUID();

  // main container
  const main = document.createElement('div');
  main.setAttribute('data-component', 'task-item-main');
  main.style.cssText = `
            display: flex;
            flex-direction: row;
            position: relative;
          `;
  outer.appendChild(main);

  // checkbox wrapper
  const checkboxWrap = document.createElement('span');
  checkboxWrap.contentEditable = 'false';
  checkboxWrap.className = 'task-item-checkbox-wrap';
  checkboxWrap.style.cssText = `
            position: relative;
            width: 24px;
            height: 1.714em;
            flex: 0 0 24px;
            align-self: start;
            cursor: pointer;
          `;
  main.appendChild(checkboxWrap);

  let isChecked = node.attrs['checked'];

  checkboxWrap.addEventListener('mousedown', (e) => {
    const pos = getPos();

    if (pos == null) return;
    isChecked = !isChecked;
    updateIcon(isChecked);

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...view.state.doc.nodeAt(pos)?.attrs,
        checked: isChecked,
      }),
    );
  });

  const iconWrap = document.createElement('span');
  iconWrap.setAttribute('data-component', 'checkbox-icon-wrap');
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.style.cssText = `
            height: 24px;
            width: 24px;
            display: inline-block;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            overflow-wrap: break-word;
            white-space: pre-wrap;
            pointer-events: none;
          `;
  checkboxWrap.appendChild(iconWrap);

  // unchecked icon
  const uncheckedSvg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  );
  uncheckedSvg.setAttribute('viewBox', '0 0 16 16');
  uncheckedSvg.setAttribute('width', '16');
  uncheckedSvg.setAttribute('height', '16');
  uncheckedSvg.setAttribute('fill', 'none');
  uncheckedSvg.dataset['component'] = 'checkbox-unchecked-icon';
  uncheckedSvg.innerHTML = `
  <rect width="12.5" height="12.5" x="1.75" y="1.75" rx="1.25" style="stroke: #8C8F97;stroke-width: 1;transition: stroke 0.2s ease-in-out;"></rect>
`;
  uncheckedSvg.style.cssText = `
            display: inline;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            transition: color 0.2s ease-in-out, fill 0.2s ease-in-out;
            width: 16px;
            height: 16px;
            pointer-events: none;
          `;

  // checked icon
  const checkedSvg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  );
  checkedSvg.setAttribute('viewBox', '0 0 16 16');
  checkedSvg.setAttribute('width', '16');
  checkedSvg.setAttribute('height', '16');
  checkedSvg.dataset['component'] = 'checkbox-checked-icon';
  checkedSvg.innerHTML = `
  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
    d="M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm9.326 4.48-1.152-.96L6.75 9.828 4.826 7.52l-1.152.96 2.5 3a.75.75 0 0 0 1.152 0z"/>
`;
  checkedSvg.style.cssText = `
            display: inline;
            line-height: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #1868db;
            fill: #fff;
            transition: color 0.2s ease-in-out, fill 0.2s ease-in-out;
            width: 16px;
            height: 16px;
            pointer-events: none;
          `;
  iconWrap.appendChild(uncheckedSvg);
  iconWrap.appendChild(checkedSvg);

  const updateIcon = (checked: boolean) => {
    uncheckedSvg.style.display = checked ? 'none' : '';
    checkedSvg.style.display = checked ? '' : 'none';
  };
  updateIcon(node.attrs['checked']);

  // placeholder
  const placeholder = document.createElement('span');
  placeholder.style.cssText = `
            position: absolute;
            color: var(--ds-text-subtlest, #6B6E76);
            margin: 0 0 0 calc(var(--ds-space-100, 8px) * 3);
            pointer-events: none;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: calc(100% - 50px);
          `;
  placeholder.textContent =
    "Type your action, then '@' if you want to notify someone about it.";
  placeholder.contentEditable = 'false';
  placeholder.className = 'placeholder-node-view';
  main.appendChild(placeholder);

  // content container
  const contentWrap = document.createElement('div');
  contentWrap.setAttribute('data-component', 'content');
  contentWrap.style.cssText = `
            margin: 0px;
            overflow-wrap: break-word;
            min-width: 0px;
            flex: 1 1 auto;
            line-height: 1.714em;
          `;
  main.appendChild(contentWrap);

  const contentDOM = document.createElement('div');
  contentDOM.className = 'task-item';
  contentWrap.appendChild(contentDOM);

  // Initial placeholder state
  const updatePlaceholder = (currentNode: any) => {
    const isEmpty = currentNode.textContent.trim().length === 0;
    placeholder.style.display = isEmpty ? '' : 'none';
  };

  updatePlaceholder(node);

  return {
    dom: outer,
    contentDOM,
    update(updatedNode: Node) {
      if (updatedNode.type !== node.type) return false;

      updatePlaceholder(updatedNode);

      // update checkbox if needed
      const newChecked = updatedNode.attrs['checked'];
      if (newChecked !== isChecked) {
        isChecked = newChecked;
        updateIcon(newChecked);
      }

      return true;
    },
  };
}
