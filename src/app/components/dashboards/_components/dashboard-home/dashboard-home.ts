import { Component } from '@angular/core';
import { MultiSelect } from '../../../../templates/multi-select/multi-select';
import { TabComponent } from '../tabs/tabs';
import { ToggleBtn } from '../../../../templates/toggle-btn/toggle-btn';

@Component({
  selector: 'app-dashboard-home',
  imports: [MultiSelect,ToggleBtn,TabComponent],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss'
})
export class DashboardHome {

}
