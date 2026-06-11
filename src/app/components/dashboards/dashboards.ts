import {
  Component,
  inject,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { setUserDetails } from './store/dashboards-store.actions';
import { DashboardSpaceLayoutService } from './_components/dashboard-space/_services';

@Component({
  selector: 'app-dashboards',
  standalone: false,
  templateUrl: './dashboards.html',
  styleUrl: './dashboards.scss',
  host: {
    '[style.--notification-row]': 'isNotificationBar && !isLayoutExpanded() ? "42px" : "0px"',
    '[style.--header-row]': 'isLayoutExpanded() ? "0px" : "48px"',
    '[style.--sidebar-col]': 'isLayoutExpanded() ? "0px" : "auto"',
    '[style.--aside-col]': 'isLayoutExpanded() || !isAside ? "0px" : "auto"',
    // existing — but gate sidebar visibility on expanded too
    '[style.--sidebar-display]':
      '!isLayoutExpanded() && (isSidebar || sidebarHovered) ? "block" : "none"',
    '[style.--sidebar-translateX]':
      '!isLayoutExpanded() && (isSidebar || sidebarHovered) ? "0px" : "-100%"',
    '[style.--sidebar-grid-area]': 'isSidebar && !isLayoutExpanded() ? "sidebar" : "main"',
    '[style.--sidebar-box-shdow]':
      'isSidebar ? "none" : "0px 8px 12px #1E1F2126, 0px 0px 1px #1E1F214F"',
  },
})
export class Dashboards {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthenticationService);
  private readonly dashboardSpaceLayoutService = inject(DashboardSpaceLayoutService);

  public resizableConfig = {
    resizableRight: true,
    maxWidth: 600,
    minWidth: 160,
  };
  public sidebarHovered: boolean = false;
  public isNotificationBar: boolean = true;
  public isSidebar: boolean = false;
  public isAside: boolean = false;
  public spotlightX: string = '-200px';
  public spotlightY: string = '-200px';

  protected readonly spaces: WritableSignal<any[]> = signal<any>([]);
  protected readonly isLayoutExpanded: WritableSignal<boolean> =
    this.dashboardSpaceLayoutService.isExpanded;

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
    this.spotlightX = event.clientX - rect.left + 'px';
    this.spotlightY = event.clientY - rect.top + 'px';
  }
  public onMainMouseLeave(): void {
    this.spotlightX = '-200px';
    this.spotlightY = '-200px';
  }

  public ngOnInit(): void {
    const userDetail = this.authService.currentUser;
    if (userDetail) this.store.dispatch(setUserDetails({ userDetail }));
  }
}
