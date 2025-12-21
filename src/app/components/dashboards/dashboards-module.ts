import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Dashboards } from './dashboards';
import { provideRouter, RouterModule, RouterOutlet, Routes } from '@angular/router';
import { DashboardsHeader } from './_components/dashboards-header/dashboards-header';
import { IconContainer } from './_components/icon-container/icon-container';
import { DashboardSearchBar } from './_components/dashboard-search-bar/dashboard-search-bar';
import { ClickOutside } from '../../directives/click-outside';
import { TabComponent } from './_components/tabs/tabs';
import { FloatingContainerDirective } from "../../directives/floating-container/floating-container";
import { SidebarItem } from '../../templates/sidebar-item/sidebar-item';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Checkbox } from '../../templates/checkbox/checkbox';
import { DashboardsSidebar } from './_components/dashboards-sidebar/dashboards-sidebar';
import { CustomizeSidebar } from './_components/dashboards-sidebar/_components/customize-sidebar/customize-sidebar';
import { FeedbackSidebar } from './_components/dashboards-sidebar/_components/feedback-sidebar/feedback-sidebar';
import { MultiSelect } from '../../templates/multi-select/multi-select';
import { ResizableDirective } from "../../directives/resizable-directive/resizable-directive";
import { OverlayModule } from '@angular/cdk/overlay';
import { MenuLinkItem } from '../../templates/menu-link-item/menu-link-item';
import { ToggleBtn } from '../../templates/toggle-btn/toggle-btn';
import { TooltipDirective } from "../../directives/tooltip-directive/tooltip-directive";

const dashboardRoutes: Routes =[
  {
    path:'',
    component: Dashboards,
    children: [
      {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'home'
      },
      {
        path: 'home',
        loadComponent: ()=> import('./_components/dashboard-home/dashboard-home')
        .then(c=>c.DashboardHome),
      },
      {
        path: 'recent',
        loadComponent: ()=> import('./_components/dashboard-recent/dashboard-recent')
        .then(c=>c.DashboardRecent),
      }
    ]
  }
]

@NgModule({
  declarations: [Dashboards,DashboardsHeader,DashboardsSidebar,CustomizeSidebar,FeedbackSidebar,IconContainer,DashboardSearchBar],
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CdkDrag,
    CdkDropList,
    ClickOutside,
    TabComponent,
    FloatingContainerDirective,
    SidebarItem,
    MenuLinkItem,
    Checkbox,
    MultiSelect,
    ToggleBtn,
    ResizableDirective,
    OverlayModule,
    TooltipDirective
],
  providers:[
    provideRouter(dashboardRoutes)
  ]
})
export class DashboardsModule { }
