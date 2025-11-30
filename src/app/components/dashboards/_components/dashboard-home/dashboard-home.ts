import { Component } from '@angular/core';
import { MultiSelect } from '../../../../templates/multi-select/multi-select';
import { TabComponent } from '../tabs/tabs';

@Component({
  selector: 'app-dashboard-home',
  imports: [MultiSelect,TabComponent],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss'
})
export class DashboardHome {

}
