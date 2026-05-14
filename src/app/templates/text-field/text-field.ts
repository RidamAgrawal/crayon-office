import { Component, forwardRef, input, Input, model, signal } from '@angular/core';
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
  public readonly placeholder = input<string>('');
  public readonly validatorFn = input<(value: string) => ValidationErrors | null>();

  private onChange = (value: string) => {};
  private onTouched = () => {};
  private onValidatorChange = () => {};

  protected error = signal<ValidationErrors | null>(null);
  protected isDirty = signal<boolean>(false);

  protected onValueChange(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.runValidation(value);
    this.isDirty.set(true);
  }

  public writeValue(value: string): void {
    this.value.set(value);
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public validate(control: AbstractControl<any, any, any>): ValidationErrors | null {
    return this.error();
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  private runValidation(value: string) {
    this.error.set(this.validatorFn()?.(value) ?? null);
    this.onValidatorChange();
  }

  public onBlur() {
    this.onTouched();
  }

  public ngOnDestroy() {
    this.error.set(null);
    this.isDirty.set(false);
  }
}
