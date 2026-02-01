import { Component } from '@angular/core';
import { MultiSelect } from '../../../../templates/multi-select/multi-select';
import { TabComponent } from '../tabs/tabs';
import { ToggleBtn } from '../../../../templates/toggle-btn/toggle-btn';
import { TabularTemplate1 } from '../../../../templates/tabular-template-1/tabular-template-1';
import { TabTemplate2 } from '../../../../templates/tab-template-2/tab-template-2';

@Component({
  selector: 'app-dashboard-home',
  imports: [MultiSelect,ToggleBtn,TabComponent, TabularTemplate1, TabTemplate2],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss'
})
export class DashboardHome {

}
