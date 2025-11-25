// import { CommonModule } from '@angular/common';
// import { Component, ContentChildren, Input, QueryList, signal, TemplateRef, WritableSignal } from '@angular/core';

export interface TabsConfig {
  headings: Array<string | TemplateRef<any>>,
  bodyPlaceholders: Array<string | TemplateRef<any>>
}

// @Component({
//   selector: 'app-tabs',
//   imports: [CommonModule],
//   templateUrl: './tabs.html',
//   styleUrl: './tabs.scss'
// })
// export class Tabs {
//   @Input() tabConfig!: TabsConfig;
//   @ContentChildren(TemplateRef) templates!: QueryList<TemplateRef<any>>;
//   tabTemplates: TemplateRef<any>[] = [];

//   activeTab: WritableSignal<number> = signal(0);

//   public ngAfterContentInit() {
//     this.tabTemplates = this.templates.toArray();
//   }
// }

import { Component, effect, Input, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateDirective } from '../../../../directives/template/template-directive';
import { TemplateService } from '../../../../services/template-service/template-service';
// import { TemplateDirective } from '../../../directives/template/template-directive';
// import { TabsConfig } from '../../../components/dashboards/_components/tabs/tabs';
// import { TemplateService } from '../../../services/template-service/template-service';

@Component({
  selector: 'app-tab',
  imports: [CommonModule, TemplateDirective],
  templateUrl: 'tabs.html',
  styleUrl: 'tabs.scss'
})
export class TabComponent {
  @Input() config!: TabsConfig;
  currentTemplate: WritableSignal<number> = signal(0);
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
        }
        else {
          this.tabsDirective.viewContainerRef.createEmbeddedView(selectedTemplate);
        }
      }
    })
  }

  public isTemplateRef(element: any) {
    return element instanceof TemplateRef;
  }
}
