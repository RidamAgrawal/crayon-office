import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, EventEmitter, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { ClickOutside } from "../../directives/click-outside";
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FloatingContainerDirective } from "../../directives/floating-container/floating-container";

@Component({
  selector: 'app-multi-select',
  imports: [CommonModule, ReactiveFormsModule, ClickOutside, FloatingContainerDirective],
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss'
})
export class MultiSelect {
  public focused: WritableSignal<boolean> = signal(false);
  public showOptions: WritableSignal<boolean> = signal(false);
  public hoveredOption: WritableSignal<number> = signal(0);
  @ViewChild('input', { static: true }) public inputElRef!: ElementRef<HTMLInputElement>;
  @Input() config: any = {
    placeholder: 'Select label',
    options: ['lab 1', 'lab 2', 'lab 3', 'lab 4', 'lab 1', 'lab 2', 'lab 3', 'lab 4', 'lab 1', 'lab 2', 'lab 3', 'lab 4', 'lab 1', 'lab 2', 'lab 3', 'lab 4', 'lab 1', 'lab 2', 'lab 3', 'lab 4'],
    isMultiSelect: true
  }
  @Output() selected: EventEmitter<any> = new EventEmitter<any>();
  public inputControl!: FormControl<string | null>;

  public unselectedOptionsIndex: number[] = [];
  public selectedOptionsIndex: number[] = [];
  constructor(private fb: FormBuilder) {
    this.inputControl = this.fb.control('');
    this.unselectedOptionsIndex = (this.config.options as string[]).map((value: string, index: number) => index);
  }

  public focusIn() {
    if (!this.focused()) {
      this.focused.set(true);
      this.showOptions.set(true);
      this.inputElRef.nativeElement.focus();
    }
  }
  public focusOut() {
    this.focused.set(false);
    this.showOptions.set(false);
  }
  public inputSpace(event: KeyboardEvent) {
    const value = (event.target as HTMLInputElement).value;
    console.log(event.key);
    switch (event.key) {
      case ' ':
        if (value == ' ') {
          if (!this.showOptions()) {
            this.showOptions.set(true);
          }
          else {
            this.selectOption(this.hoveredOption());
          }
          event.preventDefault();
        }
        break;
      case 'Enter':
        if (this.showOptions()) {
          this.selectOption(this.hoveredOption());
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.hoveredOption.update(val => val + 1);
        break;
      case 'ArrowDown':
        this.hoveredOption.update(val => val - 1);
        break;
    }
  }
  public toggleOptions() {
    this.showOptions.set(!this.showOptions());
    if (this.showOptions()) {
      this.inputElRef.nativeElement.focus();
    }
  }
  public selectOption(index: number) {
    if (!this.config.isMultiSelect) {
      if (this.selectedOptionsIndex.length) {
        this.unselectedOptionsIndex.push(this.selectedOptionsIndex[0]);
        this.selectedOptionsIndex.pop();
      }
      this.selectedOptionsIndex.push(index);
      this.focusOut();
    }
    else {
      this.selectedOptionsIndex.push(index);
      this.unselectedOptionsIndex = this.unselectedOptionsIndex.filter(ind => ind !== index);
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
  public isDisplayOptions(): boolean {
    return this.showOptions() && this.unselectedOptionsIndex.length > 0;
  }
  public emitChange(){
    this.selected.emit(
      this.selectedOptionsIndex.length
      ? !this.config.isMultiSelect
      ? this.selectedOptionsIndex.map((index: number) => this.config.options[index])[0]
      : this.selectedOptionsIndex.map((index: number) => this.config.options[index])
      : null
    );
  }
}
