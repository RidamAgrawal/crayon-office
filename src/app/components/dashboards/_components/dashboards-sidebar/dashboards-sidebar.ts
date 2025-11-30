
import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalService } from '../../../../services/modal-service/modal-service';
import { HttpService } from '../../../../services/http-service/http-service';
import { TemplateService } from '../../../../services/template-service/template-service';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';

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
  public customizeModalConfig: CustomizeModalConfig = {
    isComponent: true
  };
  public feedbackModalConfig: CustomizeModalConfig = {
    isComponent: true
  }
  public subscriptions!: Observable<any>[];
  constructor(
    private httpService: HttpService,
    private modalService: ModalService,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef
  ) {
    this.customizeModalConfig.componentRef = this.templateService.templates['customize-sidebar'];
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
        this.customizeModalConfig.inputs = {
          'internalItems': structuredClone(this.internalItems),
          'externalLinks': structuredClone(this.externalLinks)
        }
      })
  }
  public openModal(modalConfig: any) {
    this.modalService.openDashboardModal(modalConfig)
      .subscribe((output) => {
        if (output.eventName === 'saveChanges') {
          this.onCustomizedChanges(output.data);
        }
        if (output.eventName === 'sendFeedback') {
          this.onSendFeedback(output.data);
        }
      });
  }
  public onCustomizedChanges(data: any) {
    this.externalLinks = structuredClone(data.externalLinks);
    this.internalItems = structuredClone(data.internalItems);
  }
  public onSendFeedback(data: any){
    console.log('will call api here and payload data: ',data);
  }
  public ngOnDestroy() {

  }
}
