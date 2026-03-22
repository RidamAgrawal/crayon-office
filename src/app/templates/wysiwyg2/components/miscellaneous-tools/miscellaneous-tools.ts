import { Component, ElementRef, inject, input } from '@angular/core';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TextField } from '../../../text-field/text-field';
import { FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION } from '../../../wysiwyg/wysiwyg.models';
import { MediaUpload } from '../media-upload';
import { EditorCommandsService } from '../../services/editor-commands.service';
import { EmojiPicker } from '../emoji-picker';

@Component({
  selector: 'app-miscellaneous-tools',
  imports: [ScrollingModule, TextField],
  templateUrl: './miscellaneous-tools.html',
  styleUrl: './miscellaneous-tools.scss',
})
export class MiscellaneousTools {
  private overlayService = inject(OverlayService);
  private editorCommandService = inject(EditorCommandsService);


  ngOnInit() {
    this.originElementRef = (this.overlayService as any).overlayRef?._positionStrategy._origin;
  }
  protected originElementRef: ElementRef<HTMLElement | undefined> | null = null;
  protected extraElementOptions = input.required<any[]>();
  protected handleExtraElementClick(option: any, element: HTMLElement) {
    const fnString: string | undefined = option.onclick;
    if (!fnString) return;
    // Parse "functionName(arg1, arg2, ...)" pattern
    const match = fnString.match(/^(\w+)\((.*)\)$/);
    if (!match) return;
    const fnName = match[1];
    const argsString = match[2].trim();
    // Parse arguments (handles numbers, strings, null, booleans)
    const args: any[] = argsString
      ? argsString.split(',').map((a: string) => {
          const trimmed = a.trim();
          if (trimmed === 'null') return null;
          if (trimmed === 'true') return true;
          if (trimmed === 'false') return false;
          if (!isNaN(Number(trimmed))) return Number(trimmed);
          return trimmed.replace(/^['"]|['"]$/g, ''); // strip quotes
        })
      : [];
    // Call the method on this component if it exists
    const fn = (this as any)[fnName];
    if (typeof fn === 'function') {
      this.overlayService.close();
      fn.apply(this, [...args]);
    } else {
      console.warn(`Method "${fnName}" not found on Wysiwyg2 component`);
    }
  }

  private onActionItemClick() {
    this.editorCommandService.toggleTaskList();
  }

  private onUploadFileClick() {
    if (!this.originElementRef) return;
    this.overlayService.open({
      component: MediaUpload,
      connectedTo: this.originElementRef,
      positions: [FLOAT_TOP_POSITION, FLOAT_BOTTOM_POSITION],
    });
  }

  private onCodeSnippetClick() {
    this.editorCommandService.toggleCodeBlock();
  }

  private onBulletedListClick() {
    this.editorCommandService.toggleBulletList();
  }

  private onOrderedListClick() {
    this.editorCommandService.toggleOrderedList();
  }

  private setHeading(level: number) {
    this.editorCommandService.setHeading(level);
  }
  
  private onEmojiClick() {
    if (!this.originElementRef) return;
    this.overlayService.open({
      component: EmojiPicker,
      connectedTo: this.originElementRef,
      positions: [FLOAT_TOP_POSITION, FLOAT_BOTTOM_POSITION],
    });
  }

  private onExpandClick() {
    this.editorCommandService.toggleExpand();
  }

  private onPanelClick(panelType: string) {
    this.editorCommandService.insertPanel(panelType);
  }

  private onBlockquoteClick() {
    this.editorCommandService.toggleBlockquote();
  }

  private onHorizontalRuleClick() {
    this.editorCommandService.insertHorizontalRule();
  }

  private onTableClick(rows: number, cols: number) {
    this.editorCommandService.insertTable(rows, cols);
  }
}
