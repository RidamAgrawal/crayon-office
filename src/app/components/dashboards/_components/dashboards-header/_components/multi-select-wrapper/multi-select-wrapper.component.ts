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
  private pendingValue: string | string[] | null = null;
  private hasPendingValue = false;

  constructor() {
    // Re-runs when the underlying MultiSelect appears, when optionsConfig changes
    // (async-loaded options), and when selection changes.
    effect(() => {
      const instance = this.multiSelectInstance();
      if (!instance) return;

      const config = this.optionsConfig();
      this.tryApplyPending(instance, config);

      // Propagate selection changes back to the form control
      const selectedSet = instance.selectedOptions();
      const selectedArray = Array.from(selectedSet);

      const value = config?.isMultiSelect
        ? selectedArray.map((o: OptionConfigurations) => o.id)
        : (selectedArray[0]?.id ?? null);

      this.onChange?.(value as any);
    });
  }

  // Called by Angular when the form control value is programmatically set (e.g. setValue / patchValue / reset)
  public writeValue(val: string | string[] | null): void {
    this.pendingValue = val;
    this.hasPendingValue = true;
    const instance = this.multiSelectInstance();
    if (instance) this.tryApplyPending(instance, this.optionsConfig());
  }

  private tryApplyPending(instance: MultiSelect, config: any): void {
    if (!this.hasPendingValue) return;

    const val = this.pendingValue;

    // Empty/null/empty-array — clear immediately
    if (!val || (Array.isArray(val) && val.length === 0)) {
      this.applyValue(instance, val);
      this.pendingValue = null;
      this.hasPendingValue = false;
      return;
    }

    // Non-empty value — only apply once all target options exist in the list
    const targets = Array.isArray(val) ? val : [val];
    const allOptions: OptionConfigurations[] = (config?.optionLists ?? [])
      .flatMap((list: any) => list.options ?? []);

    if (targets.every(t => allOptions.some(o => o.id === t))) {
      this.applyValue(instance, val);
      this.pendingValue = null;
      this.hasPendingValue = false;
    }
  }

  private applyValue(instance: MultiSelect, val: string | string[] | null): void {
    instance.clearAll();
    if (!val) return;

    const targets = Array.isArray(val) ? val : [val];
    const allOptions: OptionConfigurations[] = (this.optionsConfig()?.optionLists ?? [])
      .flatMap((list: any) => list.options ?? []);

    targets.forEach(targetId => {
      const match = allOptions.find(o => o.id === targetId);
      if (match) instance.selectOption(match);
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
