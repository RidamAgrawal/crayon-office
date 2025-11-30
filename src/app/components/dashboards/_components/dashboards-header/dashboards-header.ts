import { Component, EventEmitter, Output } from '@angular/core';

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

  public showSidebar() {
    this.sidebarIconClick.emit(!this.isSidebar);
    this.isSidebar = !this.isSidebar;
  }

  public hoverSidebar(isHovered: boolean) {
    if(this.isSidebar) return;
    if(isHovered){
      this.sidebarIconHover.emit(isHovered);
    }
    else{
      setTimeout(()=>this.sidebarIconHover.emit(isHovered),300);
    }
  }
}
