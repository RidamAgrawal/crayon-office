import { Component, forwardRef, input, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { TextField } from '../../../../../../templates/text-field/text-field';

@Component({
  selector: 'work-item-modal-text-field-wrapper',
  templateUrl: './text-field-wrapper.component.html',
  styleUrl: './text-field-wrapper.component.scss',
  imports: [TextField],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WorkItemModalTextFieldWrapperComponent),
      multi: true,
    },
  ],
})
export class WorkItemModalTextFieldWrapperComponent implements ControlValueAccessor {
  public label = input.required<string>();
  public isMandatory = input<boolean>();
  public placeholder = input<string>();
  public textFieldValidatorFn = input<(val:string) => ValidationErrors | null>();

  public val = model<string>('');

  private onChange: ((value: string) => void) | null = null;
  private onTouched: (() => void) | null = null;

  writeValue(val: string | null): void {
    this.val.set(val ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(_isDisabled: boolean): void {}

  protected onInputChange(value: string): void {
    this.val.set(value);
    this.onChange?.(value);
    this.onTouched?.();
  }
}
