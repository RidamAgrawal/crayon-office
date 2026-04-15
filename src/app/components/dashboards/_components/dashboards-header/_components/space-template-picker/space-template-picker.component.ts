import { Component, computed, output, signal } from '@angular/core';
import {
  MADE_FOR_YOU_IDS,
  SPACE_TEMPLATE_CATEGORIES,
  SPACE_TEMPLATES,
  SpaceTemplate,
  SpaceTemplateCategory,
} from './space-template.config';

@Component({
  selector: 'space-template-picker',
  templateUrl: './space-template-picker.component.html',
  styleUrl: './space-template-picker.component.scss',
  standalone: true,
})
export class SpaceTemplatePickerComponent {
  public readonly templateSelected = output<SpaceTemplate>();
  public readonly closeRequested = output<void>();

  protected readonly categories: SpaceTemplateCategory[] = [
    'Made for you',
    ...SPACE_TEMPLATE_CATEGORIES,
  ];
  protected readonly selectedCategory = signal<SpaceTemplateCategory>('Made for you');

  protected readonly heading = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Made for you') return 'Made for you';
    return cat;
  });

  protected readonly description = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Made for you') {
      return 'Templates for you based on how similar teams work.';
    }
    return '';
  });

  protected readonly filteredTemplates = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Made for you') {
      return SPACE_TEMPLATES.filter((t) => MADE_FOR_YOU_IDS.includes(t.id));
    }
    return SPACE_TEMPLATES.filter((t) => t.category === cat);
  });

  protected selectCategory(category: SpaceTemplateCategory): void {
    this.selectedCategory.set(category);
  }

  protected selectTemplate(template: SpaceTemplate): void {
    this.templateSelected.emit(template);
  }

  protected close(): void {
    this.closeRequested.emit();
  }
}
