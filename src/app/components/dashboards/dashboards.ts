
import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardsModal } from './_components/dashboards-modal/dashboards-modal';

@Component({
  selector: 'app-dashboards',
  standalone: false,
  templateUrl: './dashboards.html',
  styleUrl: './dashboards.scss',
  host: {
    '[style.--notification-visible]': 'isNotificationBar ? "42px" : "0px"',
    '[style.--sidebar-display]': 'isSidebar || sidebarHovered ? "block" : "none"',
    '[style.--sidebar-translateX]': 'isSidebar || sidebarHovered? "0px" : "-100%"',
    '[style.--sidebar-grid-area]': 'isSidebar? "sidebar" : "main"',
    '[style.--sidebar-box-shdow]': 'isSidebar? "none" : "0px 8px 12px #1E1F2126, 0px 0px 1px #1E1F214F"',
  }
})
export class Dashboards {
  @ViewChild('modal', { read: TemplateRef, static: true }) modalTemplate!: TemplateRef<any>;

  public resizableConfig = {
    resizableRight: true,
    maxWidth: 600,
    minWidth: 160,
  }
  public sidebarHovered: boolean = false;
  public isNotificationBar: boolean = true;
  public isSidebar: boolean = false;
  public isAside: boolean = false;
  public spotlightX: string = '-200px';
  public spotlightY: string = '-200px';
  constructor(
    private vcr: ViewContainerRef
  ) { }
  
  public openModal(modalConfig: any): Observable<any> {
    this.vcr.clear();
    const dashboardsModalCompRef = this.vcr.createComponent(DashboardsModal);
    dashboardsModalCompRef.setInput('modalConfig', modalConfig);
    return dashboardsModalCompRef.instance.getComponentOutputs();
  }
  public dismissModal() {
    this.vcr.clear();
  }
  public sidebarIconHovered(hovered: boolean): void {
    this.sidebarHovered = hovered;
  }
  public sidebarIconClicked(clicked: boolean): void {
    this.isSidebar = clicked;
    this.sidebarHovered = false;
  }
  public toggleAside(): void {
    this.isAside = !this.isAside;
  }
  public onMainMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.spotlightX = (event.clientX - rect.left) + 'px';
    this.spotlightY = (event.clientY - rect.top) + 'px';
  }
  public onMainMouseLeave(): void {
    this.spotlightX = '-200px';
    this.spotlightY = '-200px';
  }
}
