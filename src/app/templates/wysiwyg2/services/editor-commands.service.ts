import { inject, Injectable } from '@angular/core';
import { lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorViewService } from './';
import {
  addRowBefore,
  addRowAfter,
  deleteRow,
  addColumnBefore,
  addColumnAfter,
  deleteColumn,
  deleteTable,
  toggleHeaderRow,
  setCellAttr,
  mergeCells,
  splitCell,
} from 'prosemirror-tables';

@Injectable({
  providedIn: 'any',
})
export class EditorCommandsService {
  private readonly editorViewService = inject(EditorViewService);

  private readonly schema = this.editorViewService.schema;
  private readonly view = this.editorViewService.view;

  public toggleBold() {
    toggleMark(this.schema().marks['strong'])(this.view().state, this.view().dispatch);
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
    setBlockType(this.schema().nodes['paragraph'])(this.view().state, this.view().dispatch);
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

  public toggleExpand() {
    const expandType = this.schema().nodes['expand'];
    const { state, dispatch } = this.view();
    const { $from } = state.selection;

    // Check if already inside an expand at any depth
    const insideExpand = Array.from({ length: $from.depth }, (_, i) => $from.node(i + 1)).some(
      (n) => n.type === expandType,
    );

    if (insideExpand) {
      // Lift out of the expand
      lift(state, dispatch);
    } else {
      // Wrap selection in expand node
      wrapIn(expandType, { title: '', expanded: true })(state, dispatch);
    }

    this.view().focus();
  }

  public insertPanel(panelType: string = 'info') {
    const panelNodeType = this.schema().nodes['panel'];
    const { state, dispatch } = this.view();

    // If already inside a panel, lift out
    const { $from } = state.selection;
    const insidePanel = Array.from({ length: $from.depth }, (_, i) => $from.node(i + 1)).some(
      (n) => n.type === panelNodeType,
    );

    if (insidePanel) {
      lift(state, dispatch);
    } else {
      wrapIn(panelNodeType, { panelType })(state, dispatch);
    }

    this.view().focus();
  }

  public toggleBlockquote() {
    const blockquoteType = this.schema().nodes['blockquote'];
    const { state, dispatch } = this.view();
    const { $from } = state.selection;

    // Already inside blockquote — lift out
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type === blockquoteType) {
        lift(state, dispatch);
        this.view().focus();
        return;
      }
    }

    wrapIn(blockquoteType)(state, dispatch);
    this.view().focus();
  }

  // Insert command — same pattern as your other commands
  public insertHorizontalRule() {
    const { state, dispatch } = this.view();
    const hrType = this.schema().nodes['horizontal_rule'];
    const { $from } = state.selection;

    // Insert hr then move cursor to next paragraph
    const tr = state.tr.replaceSelectionWith(hrType.create());

    // If at end of doc, ensure there's a paragraph after
    const insertPos = $from.pos + 1;
    if (insertPos >= state.doc.content.size) {
      tr.insert(tr.doc.content.size, this.schema().nodes['paragraph'].create());
    }

    dispatch(tr.scrollIntoView());
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
    const node = this.schema().nodes['media_single'].create({
      src,
      alt,
      width: null,
      layout: 'center',
    });
    this.view().dispatch(this.view().state.tr.replaceSelectionWith(node));
    this.view().focus();
  }

  public insertEmoji(emoji: string) {
    const node = this.schema().nodes['emoji'].create({ emoji });
    this.view().dispatch(this.view().state.tr.replaceSelectionWith(node));
    this.view().focus();
  }

  public insertTable(rows = 3, cols = 3) {
    const { state, dispatch } = this.view();
    const schema = this.schema();

    const cells = (isHeader: boolean) =>
      Array.from({ length: cols }, () =>
        isHeader
          ? schema.nodes['table_header'].createAndFill()!
          : schema.nodes['table_cell'].createAndFill()!,
      );

    const tableRows = Array.from({ length: rows }, (_, i) =>
      schema.nodes['table_row'].create(null, cells(i === 0)),
    );

    const table = schema.nodes['table'].create(null, tableRows);
    const tr = state.tr.replaceSelectionWith(table);
    dispatch(tr.scrollIntoView());
    this.view().focus();
  }

  // ── Row operations ─────────────────────────────────────────
  public addRowAbove() {
    addRowBefore(this.view().state, this.view().dispatch);
  }
  public addRowBelow() {
    addRowAfter(this.view().state, this.view().dispatch);
  }
  public deleteTableRow() {
    deleteRow(this.view().state, this.view().dispatch);
  }

  // ── Column operations ──────────────────────────────────────
  public addColumnLeft() {
    addColumnBefore(this.view().state, this.view().dispatch);
  }
  public addColumnRight() {
    addColumnAfter(this.view().state, this.view().dispatch);
  }
  public deleteTableColumn() {
    deleteColumn(this.view().state, this.view().dispatch);
  }

  // ── Table operations ───────────────────────────────────────
  public deleteTable() {
    deleteTable(this.view().state, this.view().dispatch);
  }
  public toggleTableHeaderRow() {
    toggleHeaderRow(this.view().state, this.view().dispatch);
  }
  public setCellBackground(color: string) {
    setCellAttr('background', color)(this.view().state, this.view().dispatch);
  }

  // ── Merge/split ────────────────────────────────────────────
  public mergeCells() {
    mergeCells(this.view().state, this.view().dispatch);
  }
  public splitCell() {
    splitCell(this.view().state, this.view().dispatch);
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
