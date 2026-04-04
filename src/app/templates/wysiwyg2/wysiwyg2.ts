import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { EditorViewService } from './services';
import { Toolbar } from './components';

@Component({
  selector: 'wysiwyg2',
  imports: [Toolbar],
  templateUrl: './wysiwyg2.html',
  styleUrl: './wysiwyg2.scss',
})
export class Wysiwyg2 implements AfterViewInit, OnDestroy {
  private readonly editorViewService = inject(EditorViewService);

  private readonly editorRef = viewChild<ElementRef>('editor');

  public value = input<string>(); // initial HTML
  public readonly valueChange = output<string>();


  ngAfterViewInit() {
    this.editorViewService.createView(this.value() ?? "", this.editorRef()!.nativeElement, this.valueChange);
  }

  ngOnDestroy() {
    this.editorViewService.view()?.destroy();
  }
}
