import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, signal, TemplateRef, ViewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OverlayService } from '../../services/overlay-service/overlay-service';
import { OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-multi-select',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [OverlayService],
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss'
})
export class MultiSelect {
  public hoveredOption: WritableSignal<number> = signal(0);
  @ViewChild('input', { static: true }) public inputElRef!: ElementRef<HTMLInputElement>;
  @ViewChild('optionContainer', { static: true }) public optionTemplateRef!: TemplateRef<any>;
  @Input() config: any = {
    placeholder: 'Select label',
    optionLists: [
      {
        heading: "All labels",
        options: [
          {
            label: "label 1",
            type: 'button'
          },
          {
            label: "label 2",
            type: 'button'
          }
        ]
      },
      {
        heading: "More labels",
        options: [
          {
            label: "label 3",
            type: 'button'
          },
          {
            label: "label 4",
            type: 'button'
          }
        ]
      }
    ],
    isMultiSelect: true
  }
  @Output() selected: EventEmitter<any> = new EventEmitter<any>();
  public inputControl!: FormControl<string | null>;

  public unselectedOptionsIndex: number[] = [];
  public selectedOptionsIndex: number[] = [];

  public optionsOverlayRef: OverlayRef | null = null;
  constructor(
    private fb: FormBuilder,
    private viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef,
    private overlayService: OverlayService
  ) {
    this.inputControl = this.fb.control('');
  }

  public focusIn() {
    this.inputElRef.nativeElement.focus();
    this.optionsOverlayRef = this.overlayService.open({
      template: this.optionTemplateRef,
      connectedTo: this.elementRef,
      context: { optionLists: this.config.optionLists },
      positions: [
        {
          originX: 'start', overlayX: 'start', originY: 'bottom', overlayY: 'top', offsetY: 8
        },
        {
          originX: 'start', overlayX: 'start', originY: 'top', overlayY: 'bottom', offsetY: -8
        }
      ],
      viewContainerRef: this.viewContainerRef,
      matchWidth: true
    });
  }
  public focusOut() {
    this.overlayService.close();
  }

  public toggleOptions() {
    this.optionsOverlayRef?.detach();
  }
  public selectOption(listIndex: number, optionIndex: number) {
    if (!this.config.isMultiSelect) {
      if (this.selectedOptionsIndex.length) {
        this.unselectedOptionsIndex.push(this.selectedOptionsIndex[0]);
        this.selectedOptionsIndex.pop();
      }
      this.focusOut();
    }
    else {
    }
    this.emitChange();
  }
  public clearOption(index: number) {
    this.unselectedOptionsIndex.push(index);
    this.selectedOptionsIndex = this.selectedOptionsIndex.filter(ind => ind !== index);
    this.emitChange();
  }
  public clearAll() {
    this.selectedOptionsIndex.forEach((val) => {
      this.unselectedOptionsIndex.push(val);
    })
    this.selectedOptionsIndex = [];
    this.emitChange();
  }
  public emitChange() {
    this.selected.emit(
      this.selectedOptionsIndex.length
        ? !this.config.isMultiSelect
          ? this.selectedOptionsIndex.map((index: number) => this.config.options[index])[0]
          : this.selectedOptionsIndex.map((index: number) => this.config.options[index])
        : null
    );
  }
}
