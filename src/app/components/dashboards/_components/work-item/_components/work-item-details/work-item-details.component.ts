import { Component, ElementRef, inject, input, output, signal, TemplateRef, viewChild, ViewContainerRef } from "@angular/core";
import { WorkItem } from "../../../../_models";
import { WorkItemDetailService, WorkItemDetailStateService } from "../../_services";
import { BreadCrumbsComponent } from "../../../../../../templates/breadcrumbs";
import { breadcrumbsChildren, StatusOptionsList } from "./work-item-details.constants";
import { AccordionTemplate } from "../../_templates/accordion-template";
import { ResizableDirective } from "../../../../../../directives";
import { rxResource } from "@angular/core/rxjs-interop";
import { SpaceStatusOptionConfigurations } from "../../../dashboards-header/_components/work-item-modal/work-item-modal.component";
import { HttpService } from "../../../../../../services/http-service/http-service";
import { IconContainer } from "../../../icon-container/icon-container";
import { OverlayService } from "../../../../../../services/overlay-service/overlay-service";
import { OptionWrapper } from "../../../../../../templates/option-wrapper/option-wrapper";
import { OptionsList } from "../../../../../../templates/option-wrapper/option-wrapper.model";


@Component({
    selector: 'work-item-detail',
    templateUrl: './work-item-details.component.html',
    styleUrl: './work-item-details.component.scss',
    imports: [BreadCrumbsComponent, AccordionTemplate, ResizableDirective, IconContainer],
    providers: [WorkItemDetailService, WorkItemDetailStateService],
})
export class WorkItemDetailComponent {
  private readonly httpService = inject(HttpService);
  private readonly overlayService = inject(OverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  protected readonly statusOptionTabletTemplate = viewChild<TemplateRef<any>>(
    'statusOptionTabletTemplate',
  );

  issueKey = input.required<string>();      // both hosts supply this
  preloadedIssue = input<WorkItem | null>(null);  // optional seed (modal optimization)
  updated = output<WorkItem>();             // → board sync
  close   = output<void>();                 // → modal host closes

  protected readonly availableStatuses = rxResource({
    params: () => this.preloadedIssue()?.spaceId ?? undefined,
    stream: ({ params: spaceId }) => this.httpService.getSpaceColumns(spaceId),
    defaultValue: [],
  });

  protected readonly selectedStatus = signal<SpaceStatusOptionConfigurations | null>(null);
  protected readonly showPreview = signal<boolean>(true);
  protected breadCrumbsChildren = breadcrumbsChildren;

  protected onPreviewClick(): void {
    this.showPreview.update(prev => !prev);
  }

  protected onStatusClick(element: HTMLButtonElement): void {
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists: this.buildStatusOptionsList(),
          handleOptionEvent: (action: any) => {
            this.actionEventHandler(action);
          },
        },
      },
      connectedTo: new ElementRef(element),
      positions: [
        {
          originX: 'start',
          overlayX: 'start',
          originY: 'bottom',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'start',
          overlayX: 'start',
          originY: 'top',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ],
      viewContainerRef: this.viewContainerRef,
    });
  }
  
  
    private actionEventHandler(option: SpaceStatusOptionConfigurations): void {
      switch (option.id) {
        case 'createStatus':
          break;
        case 'editStatus':
          break;
        default:
          // TBD
          this.selectedStatus.set(option);
          this.overlayService.close();
      }
    }
  
    private buildStatusOptionsList(): OptionsList[] {
      StatusOptionsList[0].options = this.availableStatuses
        .value()
        .map((status: SpaceStatusOptionConfigurations) => {
          status.visible = true;
          status.type = 'button';
          status.contentTemplateRef = this.statusOptionTabletTemplate();
          return status;
        });
      return StatusOptionsList;
    }
}