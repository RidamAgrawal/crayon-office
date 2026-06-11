import { Component, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RadioGroupOption } from './radio-group.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-radio-group',
  imports: [CommonModule],
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: RadioGroup, multi: true }],
})
export class RadioGroup implements ControlValueAccessor {
  // Inputs
  public readonly options = input.required<RadioGroupOption[]>();
  // Internal Signals
  public selectedOption = signal<string | null>(null);
  public disabled = signal<boolean>(false);
  // ControlValueAccessor
  public onChangeFn: (value: string) => void = () => {};
  public onTouchedFn: () => void = () => {};
  writeValue(obj: string): void {
    this.selectedOption.set(obj);
  }
  registerOnChange(fn: typeof this.onChangeFn): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: typeof this.onTouchedFn): void {
    this.onTouchedFn = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
  protected onChange(option: string) {
    this.onChangeFn(option);
    this.selectedOption.set(option);
  }
}
