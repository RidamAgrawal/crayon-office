import { Component, ElementRef, EventEmitter, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { AppOverlayConfig, OverlayService } from '../../../../services/overlay-service/overlay-service';

@Component({
  selector: 'app-dashboards-header',
  standalone: false,
  templateUrl: './dashboards-header.html',
  styleUrl: './dashboards-header.scss'
})
export class DashboardsHeader {
  @Output() public sidebarIconHover: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public sidebarIconClick: EventEmitter<boolean> = new EventEmitter<boolean>();

  public isSidebar: boolean = false;
  public menuItems = {
    'section-1':[
      {
        text1: 'Home',
        icon: 'home',
      },
      {
        text1: 'Jira',
        text2: 'demo1234',
        icon: 'home',
        list: [
          {
            text1: 'sub-user',
            text2: 'sub-user-details',
            icon: 'person'
          },
          {
            text1: 'sub-user-2',
            text2: 'sub-user-details',
            icon: 'person'
          }
        ]
      },
      {
        text1: 'Confluence',
        text2: 'demo1234',
        icon: 'home',
        list: [
          {
            text1: 'sub-user',
            text2: 'sub-user-details',
            icon: 'person'
          },
          {
            text1: 'sub-user-2',
            text2: 'sub-user-details',
            icon: 'person'
          }
        ]
      },
      {
        text1: 'Service Management',
        text2: 'demo1234',
        icon: 'home',
        list: [
          {
            text1: 'sub-user',
            text2: 'sub-user-details',
            icon: 'person'
          },
          {
            text1: 'sub-user-2',
            text2: 'sub-user-details',
            icon: 'person'
          }
        ]
      },
      {
        text1: 'Teams',
        text2: 'demo1234',
        icon: 'home',
        list: [
          {
            text1: 'sub-user',
            text2: 'sub-user-details',
            icon: 'person'
          },
          {
            text1: 'sub-user-2',
            text2: 'sub-user-details',
            icon: 'person'
          }
        ]
      },
      {
        text1: 'Administration',
        icon: 'home',
      },
    ],
    'section-2': [],
    'section-3': []
  }
  public menuPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetX: 0, offsetY: 8 };
  public notificationPosition = { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 0, offsetY: 8 };
  constructor(
    private viewContainerRef: ViewContainerRef,
    private overlayService: OverlayService
  ) { }

  public showSidebar() {
    this.sidebarIconClick.emit(!this.isSidebar);
    this.isSidebar = !this.isSidebar;
  }

  public hoverSidebar(isHovered: boolean) {
    if (this.isSidebar) return;
    if (isHovered) {
      this.sidebarIconHover.emit(isHovered);
    }
    else {
      setTimeout(() => this.sidebarIconHover.emit(isHovered), 300);
    }
  }

  public show(elementRef: ElementRef | HTMLElement,templateRef: TemplateRef<any>, position: any) {
    if(elementRef instanceof HTMLElement) {
      elementRef = new ElementRef(elementRef);
    }
    const menuOverlayConfig: AppOverlayConfig = {
      template: templateRef,
      viewContainerRef: this.viewContainerRef,
      connectedTo: elementRef,
      positions: [
        position ? position : this.notificationPosition
      ]
    };
    this.overlayService.open(menuOverlayConfig);
  }
}
