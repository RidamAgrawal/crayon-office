import { Component, forwardRef, input, model, viewChild } from '@angular/core';
import { Wysiwyg2 } from '../../../../../../templates/wysiwyg2/wysiwyg2';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'wysiwyg-editor-wrapper',
  templateUrl: './wysiwyg-editor-wrapper.component.html',
  styleUrl: './wysiwyg-editor-wrapper.component.scss',
  imports: [Wysiwyg2],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WysiwygEditorWrapperComponent),
      multi: true,
    },
  ],
})
export class WysiwygEditorWrapperComponent implements ControlValueAccessor {
  public readonly isMandatory = input<boolean>();
  public val = model<string>();
  private readonly wysiwygInstance = viewChild(Wysiwyg2, { read: Wysiwyg2 });
  private disabled = false;
  private onChange: ((value: string) => void) | null = null;
  private onTouched: (() => void) | null = null;

  public writeValue(val: string | null): void {
    this.val.set(val ?? '');
  }
  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onValueChange(value: string): void {
    this.val.set(value);
    this.onChange?.(value);
    this.onTouched?.();
  }
}
