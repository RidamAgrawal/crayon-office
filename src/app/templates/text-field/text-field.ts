import { Component, effect, forwardRef, Input, model, signal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

@Component({
  selector: 'text-field',
  imports: [FormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextField),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TextField),
      multi: true,
    },
  ]
})
export class TextField implements ControlValueAccessor, Validator {
  public readonly value = model<string>('');
  @Input() public validatorFn?: (value: string) => ValidationErrors | null;

  private onChange = (value: string) => {};
  private onTouched = () => {};
  private onValidatorChange = () => {};

  protected error = signal<ValidationErrors | null>(null);
  protected isDirty = signal<boolean>(false);

  constructor() {
    effect(() => {
      const val = this.value();
      this.onChange(val);
      this.runValidation(val);
    });
  }

  writeValue(value: string): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(control: AbstractControl<any, any, any>): ValidationErrors | null {
    return this.error();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  private runValidation(value: string) {
    this.error.set(this.validatorFn ? this.validatorFn(value) : null);
    this.onValidatorChange();
  }

  onBlur() {
    this.onTouched();
  }

  ngOnDestroy() {
    this.error.set(null);
    this.isDirty.set(false);
  }
}
