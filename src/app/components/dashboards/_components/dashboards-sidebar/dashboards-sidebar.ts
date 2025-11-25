
import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalService } from '../../../../services/modal-service/modal-service';
import { HttpService } from '../../../../services/http-service/http-service';
import { TemplateService } from '../../../../services/template-service/template-service';

export interface CustomizeModalConfig {
  isTemplate?: boolean | null;
  isComponent?: boolean | null;
  templateRef?: TemplateRef<any> | null;
  componentRef?: any;
  inputs?: Record<string, any> | null;
}

@Component({
  selector: 'app-dashboards-sidebar',
  standalone: false,
  templateUrl: './dashboards-sidebar.html',
  styleUrl: './dashboards-sidebar.scss'
})
export class DashboardsSidebar {
  @ViewChild('customizeModal', { read: TemplateRef, static: true }) customizeModalTemplate!: TemplateRef<any>;
  public internalItems: any = [];
  public externalLinks: any = [];
  public customizeItem: any = { visible: true, disableHoverAnimation: true };
  public feedbackItem: any = { visible: true, disableHoverAnimation: true };
  public myCustomizeModalConfig: CustomizeModalConfig = {
    isComponent: true
  };
  public feedbackModalConfig: CustomizeModalConfig = {
    isComponent: true
  }
  constructor(
    private httpService: HttpService,
    private modalService: ModalService,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef
  ) {
    this.myCustomizeModalConfig.componentRef = this.templateService.templates['customize-sidebar'];
    this.feedbackModalConfig.componentRef = this.templateService.templates['feedback-sidebar'];
  }
  ngOnInit() {
    this.httpService.getSidebarItemConfig()
      .subscribe((res: any) => {
        this.internalItems = res.internalItems;
        this.externalLinks = res.externalLinks;
        this.customizeItem = res.customizeSidebar;
        this.feedbackItem = res.feedback;
        this.cdr.detectChanges();
        this.myCustomizeModalConfig.inputs = {
          'internalItems': structuredClone(this.internalItems),
          'externalLinks': structuredClone(this.externalLinks)
        }
      })
  }
  public openModal(modalConfig: any) {
    this.modalService.openDashboardModal(modalConfig);
  }
}
