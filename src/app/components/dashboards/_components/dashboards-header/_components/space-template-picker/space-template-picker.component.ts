import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  CATEGORY_META,
  SPACE_TEMPLATE_CATEGORIES,
  SPACE_TEMPLATES,
  SpaceTemplate,
  SpaceTemplateCategory,
} from './space-template.config';
import { ScrollBorder } from "../../../../../../directives/scroll-border/scroll-border.directive";

@Component({
  selector: 'space-template-picker',
  templateUrl: './space-template-picker.component.html',
  styleUrl: './space-template-picker.component.scss',
  standalone: true,
  imports: [ScrollBorder],
})
export class SpaceTemplatePickerComponent implements OnInit {
  public readonly templateSelected = output<SpaceTemplate>();
  public readonly closeRequested = output<void>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly illustrations = signal<Record<string, SafeHtml>>({});

  protected readonly categories: SpaceTemplateCategory[] = [
    'Made for you',
    ...SPACE_TEMPLATE_CATEGORIES,
  ];
  protected readonly selectedCategory = signal<SpaceTemplateCategory>('Made for you');

  protected readonly selectedSpaceTemplate = signal<SpaceTemplate | null>(null);

  protected readonly heading = computed(() => CATEGORY_META[this.selectedCategory()].heading);

  protected readonly description = computed(() => CATEGORY_META[this.selectedCategory()].description);

  protected readonly filteredTemplates = computed(() => {
    const cat = this.selectedCategory();
    return SPACE_TEMPLATES.filter((t) => t.category.includes(cat));
  });

  public ngOnInit(): void {
    for (const template of SPACE_TEMPLATES) {
      const url = template.illustration;
      if (!url || this.illustrations()[url]) continue;
      fetch(url)
        .then((response) => (response.ok ? response.text() : ''))
        .then((markup) => {
          if (!markup) return;
          this.illustrations.update((map) => ({
            ...map,
            [url]: this.sanitizer.bypassSecurityTrustHtml(markup),
          }));
        })
        .catch(() => {});
    }
  }

  protected illustrationFor(template: SpaceTemplate): SafeHtml | null {
    const url = template.illustration;
    return url ? this.illustrations()[url] ?? null : null;
  }

  protected selectCategory(category: SpaceTemplateCategory): void {
    this.selectedCategory.set(category);
  }

  protected selectTemplate(template: SpaceTemplate): void {
    this.selectedSpaceTemplate.set(template);
  }

  protected close(): void {
    this.closeRequested.emit();
  }

  protected deselectSpaceTemplate(): void {
    this.selectedSpaceTemplate.set(null);
  }

  protected selectCurrentTemplate(): void {
    const selectedSpaceTemplate = this.selectedSpaceTemplate();
    if (!selectedSpaceTemplate) return;
    this.templateSelected.emit(selectedSpaceTemplate);
  }
}
