import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FloatingContainerDirective } from '../../directives/floating-container/floating-container';

@Component({
  selector: 'sidebar-item',
  imports: [CommonModule,FloatingContainerDirective],
  templateUrl: './sidebar-item.html',
  styleUrl: './sidebar-item.scss',
  host: {
    '[style.--opened]': 'opened ? "opened" : "closed"',
    '[style.--sidebar-item-icon-arrow-angle]': 'opened ? "90deg" : "0deg"',
    '[style.--sidebar-item-icon-arrow]': 'opened ? "flex" : "none"',
    '[style.--sidebar-item-icon]': 'opened ? "none" : "block"',
    '[style.--sidebar-item-no-hover-animation]': 'sideBarItemConfig?.disableHoverAnimation ? "4px" : "8px"'
  }
})
export class SidebarItem {
  @Input({required: true}) sideBarItemConfig: any;
  public opened: boolean = false;
}
