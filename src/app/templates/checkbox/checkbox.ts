import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule, CommonModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true
    }
  ],
  host: {
    '[style.--disabled]':  'isDisabled ? "0.5" : "1"',
  }
})
export class Checkbox implements ControlValueAccessor {
  public value: boolean = false;
  public isDisabled: boolean = false;
  @Output() valChange = new EventEmitter<boolean>();

  private onChange = (val: boolean) => { };
  private onTouched = () => { };
  writeValue(val: boolean): void {
    this.value = val
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
  onChangeEvent(event: Event) {
    const newValue = (event?.target as HTMLInputElement).checked;
    this.value = newValue;
    this.onChange(newValue);
    this.valChange.emit(newValue);
  }
  @Input() public checkboxConfig: any;
}
