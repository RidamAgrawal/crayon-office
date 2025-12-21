import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  AppOverlayConfig,
  OverlayService,
} from '../../services/overlay-service/overlay-service';
import { TooltipDirective } from '../../directives/tooltip-directive/tooltip-directive';
import { OptionWrapper } from '../option-wrapper/option-wrapper';

@Component({
  selector: 'sidebar-item',
  imports: [CommonModule, TooltipDirective],
  templateUrl: './sidebar-item.html',
  styleUrl: './sidebar-item.scss',
  host: {
    '[style.--opened]': 'opened ? "opened" : "closed"',
    '[style.--sidebar-item-icon-arrow-angle]': 'opened ? "90deg" : "0deg"',
    '[style.--sidebar-item-icon-arrow]': 'opened ? "flex" : "none"',
    '[style.--sidebar-item-icon]': 'opened ? "none" : "block"',
    '[style.--sidebar-item-no-hover-animation]':
      'sideBarItemConfig?.disableHoverAnimation ? "4px" : "8px"',
  },
})
export class SidebarItem {
  @Input({ required: true }) sideBarItemConfig: any;
  @ViewChild('moreBtn', { read: TemplateRef, static: true })
  optionsTemplate!: TemplateRef<any>;
  public opened: boolean = false;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef,
    private overlayService: OverlayService
  ) {}

  public openModal() {
    // const overlayConfig: AppOverlayConfig = {
    //   template,
    //   viewContainerRef: this.viewContainerRef,
    //   positions,
    //   connectedTo: this.elementRef
    // }
    // this.overlayService.open(overlayConfig);
    if (
      this.sideBarItemConfig.actionEventHandler &&
      typeof this.sideBarItemConfig.actionEventHandler == 'function'
    ) {
      const action = {
        title: this.sideBarItemConfig.title,
        type: this.sideBarItemConfig.type,
        connectedTo: this.elementRef,
        viewContainerRef: this.viewContainerRef,
      };
      this.sideBarItemConfig.actionEventHandler(this.sideBarItemConfig, action);
    }
  }

  public handleToolEvent(toolEvent: any, event: MouseEvent) {
    if (toolEvent.type == 'options') {
      const overlayConfig: AppOverlayConfig = {
        // template: this.optionsTemplate,
        component: OptionWrapper,
        componentInputs: {
          optionListsConfig: {
            optionLists: toolEvent.optionLists,
            handleOptionEvent: (action: any) => {
              this.sideBarItemConfig.actionEventHandler(this.sideBarItemConfig, action);
            },
          },
        },
        context: { optionLists: toolEvent.optionLists },
        // viewContainerRef: this.viewContainerRef,
        positions: [
          {
            originX: 'start',
            overlayX: 'start',
            originY: 'bottom',
            overlayY: 'top',
            offsetY: 10,
          },
          {
            originX: 'start',
            overlayX: 'start',
            originY: 'top',
            overlayY: 'bottom',
            offsetY: -10,
          },
        ],
        connectedTo: new ElementRef(event.target),
      };
      toolEvent.optionOverlayRef = this.overlayService.open(overlayConfig);
    }
  }
}
