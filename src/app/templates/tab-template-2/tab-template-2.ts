import {
  Component,
  effect,
  Input,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { TabsConfig } from '../../components/dashboards/_components/tabs/tabs';
import { TemplateDirective } from '../../directives/template/template-directive';
import { TemplateService } from '../../services/template-service/template-service';
import { CommonModule } from '@angular/common';

export interface Tabs2Config extends TabsConfig {
  sectionHeadings: string[];
}

@Component({
  selector: 'app-tab-template-2',
  imports: [CommonModule, TemplateDirective],
  templateUrl: './tab-template-2.html',
  styleUrl: './tab-template-2.scss',
})
export class TabTemplate2 {
  @Input() public config!: Tabs2Config;
  public currentTemplate: WritableSignal<number> = signal(0);
  @ViewChild(TemplateDirective, { static: true }) tabsDirective!: TemplateDirective;

  constructor(private templateService: TemplateService) {
    effect(() => {
      const templateIndex = this.currentTemplate();
      if (this.config && this.config.bodyPlaceholders[templateIndex] && this.tabsDirective) {
        this.tabsDirective.viewContainerRef.clear();
        const selectedTemplate = this.config.bodyPlaceholders[templateIndex];
        if (typeof selectedTemplate == 'string') {
          const placeholderComponent = this.templateService.templates[selectedTemplate];
          this.tabsDirective.viewContainerRef.createComponent(placeholderComponent);
        } else {
          this.tabsDirective.viewContainerRef.createEmbeddedView(selectedTemplate);
        }
      }
    });
  }

  public isTemplateRef(element: any) {
    return element instanceof TemplateRef;
  }
}
