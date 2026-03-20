import { inject, Injectable } from '@angular/core';
import { lift, setBlockType, toggleMark } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorViewService } from './';

@Injectable({
  providedIn: 'any',
})
export class EditorCommandsService {
  private readonly editorViewService = inject(EditorViewService);

  private readonly schema = this.editorViewService.schema;
  private readonly view = this.editorViewService.view;

  constructor() {
    console.log('editor commands service');
  }

  public toggleBold() {
    toggleMark(this.schema().marks['strong'])(
      this.view().state,
      this.view().dispatch,
    );
  }

  public toggleItalic() {
    toggleMark(this.schema().marks['em'])(this.view().state, this.view().dispatch);
  }

  public toggleUnderline() {
    toggleMark(this.schema().marks['u'])(this.view().state, this.view().dispatch);
  }

  public toggleOverline() {
    toggleMark(this.schema().marks['o'])(this.view().state, this.view().dispatch);
  }

  public toggleUnderlineSquiggle() {
    toggleMark(this.schema().marks['us'])(this.view().state, this.view().dispatch);
  }

  public toggleStrikethrough() {
    toggleMark(this.schema().marks['s'])(this.view().state, this.view().dispatch);
  }

  public toggleSubscript() {
    toggleMark(this.schema().marks['sub'])(this.view().state, this.view().dispatch);
  }

  public toggleSuperscript() {
    toggleMark(this.schema().marks['sup'])(this.view().state, this.view().dispatch);
  }

  public toggleCode() {
    toggleMark(this.schema().marks['code'])(this.view().state, this.view().dispatch);
  }

  public setHeading(level: number) {
    setBlockType(this.schema().nodes['heading'], { level })(
      this.view().state,
      this.view().dispatch,
    );
  }

  public setParagraph() {
    setBlockType(this.schema().nodes['paragraph'])(
      this.view().state,
      this.view().dispatch,
    );
  }

  public toggleBulletList() {
    const listType = this.schema().nodes['bullet_list'];
    const itemType = this.schema().nodes['list_item'];
    // If already inside a list, lift out; otherwise wrap in list
    if (!wrapInList(listType)(this.view().state)) {
      liftListItem(itemType)(this.view().state, this.view().dispatch);
    } else {
      wrapInList(listType)(this.view().state, this.view().dispatch);
    }
  }

  public toggleOrderedList() {
    const listType = this.schema().nodes['ordered_list'];
    const itemType = this.schema().nodes['list_item'];
    if (!wrapInList(listType)(this.view().state)) {
      liftListItem(itemType)(this.view().state, this.view().dispatch);
    } else {
      wrapInList(listType)(this.view().state, this.view().dispatch);
    }
  }

  public toggleTaskList() {
    const taskListType = this.schema().nodes['task_list'];
    const taskItemType = this.schema().nodes['task_item'];
    // Try wrapping; if not possible (already in task list), lift out
    if (!wrapInList(taskListType)(this.view().state)) {
      liftListItem(taskItemType)(this.view().state, this.view().dispatch);
    } else {
      wrapInList(taskListType)(this.view().state, this.view().dispatch);
    }
  }

  public toggleCodeBlock() {
    const codeBlockType = this.schema().nodes['code_block'];
    const { state, dispatch } = this.view();

    // If already in a code block, do nothing
    const { $from } = state.selection;
    if ($from.parent.type === codeBlockType) return;

    setBlockType(codeBlockType)(state, dispatch);
    this.view().focus();
  }

  public liftList() {
    lift(this.view().state, this.view().dispatch);
  }

  public setTextColor(hex: string) {
    toggleMark(this.schema().marks['color'], { color: '#' + hex })(
      this.view().state,
      this.view().dispatch,
    );
  }

  public insertImage(src: string, alt = '') {
    const node = this.schema().nodes['image'].create({ src, alt });
    this.view().dispatch(this.view().state.tr.replaceSelectionWith(node));
    this.view().focus();
  }

  public insertEmoji(emoji: string) {
    const node = this.schema().nodes['emoji'].create({ emoji });
    this.view().dispatch(this.view().state.tr.replaceSelectionWith(node));
    this.view().focus();
  }

  public undo() {
    undo(this.view().state, this.view().dispatch);
  }
  public redo() {
    redo(this.view().state, this.view().dispatch);
  }

  public focus() {
    this.view().focus();
  }
}
