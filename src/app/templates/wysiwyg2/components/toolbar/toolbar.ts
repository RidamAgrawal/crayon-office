import {
  Component,
  ElementRef,
  inject,
  Injector,
  ViewContainerRef,
} from '@angular/core';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../option-wrapper/option-wrapper';
import {
  FLOAT_BOTTOM_POSITION,
  FLOAT_TOP_POSITION,
} from '../../../wysiwyg/wysiwyg.models';
import { WysiwygEditorImage2Service } from '../../services/editor-image.service';
import { EditorCommandsService } from '../../services/editor-commands.service';
import { OptionsList } from '../../../option-wrapper/option-wrapper.model';
import { EmojiPicker } from '../emoji-picker';
import { MiscellaneousTools } from '../miscellaneous-tools';
import { MediaUpload } from '../media-upload';
import { ColorPicker } from '../color-picker';
import { HttpService } from '../../../../services/http-service/http-service';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly httpService = inject(HttpService);
  protected editorImageService = inject(WysiwygEditorImage2Service);
  private editorCommandService = inject(EditorCommandsService);

  // private view!: EditorView;
  // private schema!: Schema;

  protected colorPallettes: any[] = [];
  protected textFormatOptions: OptionsList[] = [];
  protected textStyleOptions: OptionsList[] = [];
  protected listsOptions: OptionsList[] = [];
  protected extraElementOptions: any[] = [];

  public ngOnInit() {
    this.httpService.getWysiwygEditorConfig().subscribe((res: any) => {
      this.textFormatOptions = res.textFormatOptions;
      this.textStyleOptions = res.textStyleOptions;
      this.listsOptions = res.listsOptions;
      this.extraElementOptions = res.extraElementOptions;
      this.colorPallettes = res.colorPickerOptions;
    });
  }

  protected onUndo() {
    this.editorCommandService.undo();
  }
  protected onRedo() {
    this.editorCommandService.redo();
  }

  protected onTextStylesClick(element: Element) {
    const optionListsConfig = {
      optionLists: this.textStyleOptions,
      handleOptionEvent: (option: any) => {
        switch (option.id) {
          case 'strong':
            this.editorCommandService.toggleBold();
            break;
          case 'em':
            this.editorCommandService.toggleItalic();
            break;
          case 'u':
            this.editorCommandService.toggleUnderline();
            break;
          case 'us':
            this.editorCommandService.toggleUnderlineSquiggle();
            break;
          case 's':
            this.editorCommandService.toggleStrikethrough();
            break;
          case 'o':
            this.editorCommandService.toggleOverline();
            break;
          case 'code':
            this.editorCommandService.toggleCode();
            break;
          case 'sub':
            this.editorCommandService.toggleSubscript();
            break;
          case 'sup':
            this.editorCommandService.toggleSuperscript();
            break;
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  // For color picker (already in your template)
  protected onColorSelect(colorHexCode: string) {
    this.editorCommandService.setTextColor(colorHexCode);
    this.overlayService.close(); // optional
  }

  // For image upload (your existing onUploadingFile, onInsertUrlImage, onCaptureClick)
  // protected onUploadingFile(...) {
  //   // ... get dataUrl
  //   this.insertImage(dataUrl, file.name);
  //   this.closeOverlay();
  // }

  // protected onInsertUrlImage() {
  //   this.insertImage(this.imgPreviewLink());
  //   this.closeOverlay();
  // }

  protected onTextFormatClick(element: HTMLElement) {
    const optionListsConfig = {
      optionLists: this.textFormatOptions,
      handleOptionEvent: (option: any) => {
        if (option.id.includes('h')) {
          this.editorCommandService.setHeading(option.id.split('h').pop());
        } else {
          this.editorCommandService.setParagraph();
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onListClick(element: HTMLElement) {
    const optionListsConfig = {
      optionLists: this.listsOptions,
      handleOptionEvent: (option: any) => {
        switch (option.id) {
          case 'ul':
            this.editorCommandService.toggleBulletList();
            break;
          case 'ol':
            this.editorCommandService.toggleOrderedList();
            break;
          case 'taskList':
            this.editorCommandService.toggleTaskList();
            break;
        }
        this.overlayService.close();
      },
    };

    this.overlayService.open({
      component: OptionWrapper,
      connectedTo: new ElementRef(element),
      componentInputs: { optionListsConfig },
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onColorPickerClick(element: HTMLElement) {
    this.overlayService.open({
      component: ColorPicker,
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
      componentInputs: { colorPallettes: this.colorPallettes },
      injector: this.injector,
      providers: [
        { provide: EditorCommandsService, useValue: this.editorCommandService },
      ],
    });
  }

  protected onMultiMediaUploadClick(element: HTMLElement) {
    this.overlayService.open({
      component: MediaUpload,
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onUploadFileClick() {
    const fileInputElement = document.createElement('input');
    fileInputElement.type = 'file';
    fileInputElement.accept = 'image/*';
    fileInputElement.click();
    fileInputElement.onchange = (event: any) => {
      const file = event.target.files[0];
      this.editorCommandService.insertImage(file, file.name);
    };
  }
  protected onInsertUrlImage() {
    this.editorCommandService.insertImage(
      this.editorImageService.imgPreviewLink(),
    );
  }

  protected onCodeSnippetClick() {
    // const codeBlockType = this.schema.nodes['code_block'];
    // const { state, dispatch } = this.view;

    // // If already in a code block, do nothing
    // const { $from } = state.selection;
    // if ($from.parent.type === codeBlockType) return;

    // setBlockType(codeBlockType)(state, dispatch);
    // this.view.focus();
    this.editorCommandService.toggleCodeBlock();
  }

  protected onEmojiBtnClick(element: HTMLElement) {
    this.overlayService.open({
      component: EmojiPicker,
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
    });
  }

  protected onExtraElementClick(element: HTMLElement) {
    this.overlayService.open({
      component: MiscellaneousTools,
      viewContainerRef: this.viewContainerRef,
      connectedTo: new ElementRef(element),
      positions: [FLOAT_BOTTOM_POSITION, FLOAT_TOP_POSITION],
      componentInputs: {
        extraElementOptions: this.extraElementOptions[0].options,
      },
      providers: [
        { provide: EditorCommandsService, useValue: this.editorCommandService },
      ],
    });
  }

  protected handleExtraElementClick(option: any) {
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
      fn.apply(this, args);
      this.overlayService.close();
    } else {
      console.warn(`Method "${fnName}" not found on Wysiwyg2 component`);
    }
  }
}
