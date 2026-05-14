import { Component } from "@angular/core";
import { DashboardSpaceHeader } from "./_components/dashboard-space-header/dashboard-space-header.component";
import { RouterOutlet } from "@angular/router";
import { DashboardSpaceBoardViewComponent } from "./_components/dashboard-space-board-view/dashboard-space-board-view.component";

@Component({
    selector: 'dashboard-space',
    templateUrl: './dashboard-space.component.html',
    styleUrl: './dashboard-space.component.scss',
    imports: [DashboardSpaceHeader, RouterOutlet, DashboardSpaceBoardViewComponent]
})
export class DashboardSpace {

}