import { Component, effect, input, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MultiSelect } from '../../../../../../templates/multi-select/multi-select';
import { OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';

@Component({
  selector: 'multi-select-wrapper',
  templateUrl: './multi-select-wrapper.component.html',
  styleUrl: './multi-select-wrapper.component.scss',
  standalone: true,
  imports: [MultiSelect],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MultiSelectWrapper,
      multi: true,
    },
  ],
})
export class MultiSelectWrapper implements ControlValueAccessor {
  private readonly multiSelectInstance = viewChild(MultiSelect, {
    read: MultiSelect,
  });

  public readonly label = input.required<string>();
  public readonly isMandatory = input<boolean>();
  public readonly optionsConfig = input.required<any>();

  public isDisabled = false;

  private onChange: ((value: string | string[] | null) => void) | null = null;
  private onTouched: (() => void) | null = null;

  constructor() {
    // React to signal changes from the underlying MultiSelect and propagate to the form control
    effect(() => {
      const instance = this.multiSelectInstance();
      if (!instance) return;

      // Tap into the selectedOptions signal — re-runs whenever selection changes
      const selectedSet = instance.selectedOptions();
      const selectedArray = Array.from(selectedSet);

      const value = this.optionsConfig()?.isMultiSelect
        ? selectedArray.map((o: OptionConfigurations) => o.id)
        : (selectedArray[0]?.id ?? null);

      this.onChange?.(value as any);
    });
  }

  // Called by Angular when the form control value is programmatically set (e.g. patchValue / reset)
  public writeValue(val: string | string[] | null): void {
    const instance = this.multiSelectInstance();
    if (!instance) return;

    // Clear current selection, restoring all hidden options to visible
    instance.clearAll();

    if (!val) return;

    const targets = Array.isArray(val) ? val : [val];

    // Find and select matching options by label across all optionLists
    const allOptions: OptionConfigurations[] = (this.optionsConfig()?.optionLists ?? [])
      .flatMap((list: any) => list.options ?? []);

    targets.forEach(targetLabel => {
      const match = allOptions.find(o => o.label === targetLabel);
      if (match) {
        instance.selectOption(match);
      }
    });
  }

  public registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Called from the template when the MultiSelect loses focus
  public markAsTouched(): void {
    this.onTouched?.();
  }
}
