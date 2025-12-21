
import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { HttpService } from '../../../../services/http-service/http-service';
import { TemplateService } from '../../../../services/template-service/template-service';
import { Observable } from 'rxjs';
import { AppOverlayConfig, OverlayService } from '../../../../services/overlay-service/overlay-service';

export interface CustomizeModalConfig {
  isTemplate?: boolean | null;
  isComponent?: boolean | null;
  templateRef?: TemplateRef<any> | null;
  componentRef?: any;
  inputs?: Record<string, any> | null;
  componentOutputs?: Record<string, (data: any) => void>;
}

@Component({
  selector: 'app-dashboards-sidebar',
  standalone: false,
  templateUrl: './dashboards-sidebar.html',
  styleUrl: './dashboards-sidebar.scss'
})
export class DashboardsSidebar {
  @ViewChild('recentTemplate', { read: TemplateRef, static: true }) recentTemplate!: TemplateRef<any>;

  public internalItems!: any[];
  public externalLinks!: any[];
  public customizeItem: any = { visible: true, disableHoverAnimation: true};
  public feedbackItem: any = { visible: true, disableHoverAnimation: true};
  public customizeModalConfig: AppOverlayConfig = {
    componentOutputs: { saveChanges: (data: any) => this.onCustomizedChanges(data) },
    hasBackdrop: true,
    closeOnBackdropClick: true 
  };
  public feedbackModalConfig: AppOverlayConfig = {
   componentOutputs: { sendFeedback: (data: any) => this.onSendFeedback(data) },
   hasBackdrop: true, 
  };
  public subscriptions!: Observable<any>[];
  constructor(
    private httpService: HttpService,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef,
    private overlayService: OverlayService
  ) {
    this.customizeModalConfig.component = this.templateService.templates['customize-sidebar'];
    this.feedbackModalConfig.component = this.templateService.templates['feedback-sidebar'];
  }
  ngOnInit() {
    this.httpService.getSidebarItemConfig()
      .subscribe((res: any) => {
        this.internalItems = res.internalItems;
        this.externalLinks = res.externalLinks;
        this.customizeItem = res.customizeSidebar;
        this.feedbackItem = res.feedback;
        this.subscribeToolsActions();
        this.cdr.detectChanges();
      })
  }
  public openModal(modalConfig: AppOverlayConfig) {
    if (modalConfig.closeOnBackdropClick) {
      this.prepareCustomizeModalInputs();
    }
    this.overlayService.open(modalConfig);
  }
  public onCustomizedChanges(data: any) {
    if(data) {
      const oldIternalItems = this.internalItems;
      this.internalItems = data.internalItems.map((item: any)=>{
        const targetItem = oldIternalItems.find(oldItem=>oldItem.title==item.title);
        targetItem.visible = item.visible;
        return targetItem;
      });
      const oldExternalLinks = this.externalLinks;
      this.externalLinks = data.externalLinks.map((item: any)=>{
        const targetItem = oldExternalLinks.find(oldItem=>oldItem.title==item.title);
        targetItem.visible = item.visible;
        return targetItem;
      });
      this.cdr.detectChanges();
    }
    this.overlayService.close(); //overlayService is not defined
  }
  public onSendFeedback(data: any) {
    console.log('will call api here and payload data: ', data);
    this.overlayService.close();
  }
  public subscribeToolsActions() {
    const recursivelyIterateItems = (items: any[]) => {
      items.forEach((item: any) => {
        item.actionEventHandler = (item: any,action: any) => this.handleActionEvent(item, action);
        if (item.list) {
          recursivelyIterateItems(item.list);
        }
        else if (item?.multipleLists?.length) {
          item.multipleLists.forEach((list: any) => {
            recursivelyIterateItems(list.list);
          })
        }
      })
    }
    recursivelyIterateItems(this.internalItems);
  }
  public handleActionEvent(item: any,action: any) {
    switch (action.id) {
      case 'modal':
        if (action.viewContainerRef) {
          this.overlayService.open({
            template: this.recentTemplate,
            connectedTo: action.connectedTo,
            viewContainerRef: action.viewContainerRef,
            positions: [
              {
                originX: 'end',originY: 'top',overlayX: 'start',overlayY: 'top',
              },
            ],
          });
        }
        break;
      case 'hide':
        item.visible = false;
        action.label = 'Show item in sidebar';
        action.icon = action.id = 'show';
        break;
      case 'show':
        item.visible = true;
        action.label = 'Hide item from sidebar';
        action.icon = action.id = 'hide';
        break;
    }
    this.cdr.detectChanges();
  }
  public prepareCustomizeModalInputs() {
    this.customizeModalConfig.componentInputs = {
      internalItems: this.internalItems.map( (item: any) => { return {visible: item.visible, title: item.title, icon: item.icon, contentOutside: true} }),
      externalLinks: this.externalLinks.map( (item: any) => { return {visible: item.visible, title: item.title, icon: item.icon, contentOutside: true} })
    };
  }
  public ngOnDestroy() {

  }
}
