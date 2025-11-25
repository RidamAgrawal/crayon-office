import { Component } from '@angular/core';
import { NavDropdown } from './_components/nav-dropdown/nav-dropdown';
import { NavDropdownConfig, NavDropdownConfigType } from './_components/nav-dropdown/nav-dropdown.model';
import { NavMenuBtn } from "./_components/nav-menu-btn/nav-menu-btn";
import { NavButtonConfig } from './_components/nav-menu-btn/nav-menu-btn.model';

@Component({
  selector: 'app-header',
  imports: [NavDropdown, NavMenuBtn],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  dropdownConfig :NavDropdownConfig = {
    label : 'Features',
    type: NavDropdownConfigType['multi-columned'],
    placeholdersItem: [['All Features','Jira','hello']],
    headers: ['list']
  }
  dropdownConfig2 :NavDropdownConfig = {
    label : 'Solutions',
    type: NavDropdownConfigType['multi-columned'],
    placeholdersItem: [['Marketing','Engineering','Design','Operations','IT'],['Planning','Campaign Management','Agile Project Management','Program Management'],['Enterprise']],
    headers: ['teams','use cases','company size']
  }
  dropdownConfigs: NavDropdownConfig[]=[
    {
      label : 'Features',
      type: NavDropdownConfigType['multi-columned'],
      placeholdersItem: [['All Features','Jira','hello']],
      headers: ['list']
    },
    {
      label : 'Solutions',
      type: NavDropdownConfigType['multi-columned'],
      placeholdersItem: [['Marketing','Engineering','Design','Operations','IT'],['Planning','Campaign Management','Agile Project Management','Program Management'],['Enterprise']],
      headers: ['teams','use cases','company size']
    },
    {
      label : 'Guide',
      type: NavDropdownConfigType['multi-columned'],
      placeholdersItem: [],
      headers: []
    },
    {
      label : 'Templates',
      type: NavDropdownConfigType['multi-columned'],
      placeholdersItem: [['All Templates','Software Development','Financial','Marketing','Design',"Sales","Operations","Service Management","HR","Legal","IT"]],
      headers: []
    },
    {
      label : 'Pricing',
      type: NavDropdownConfigType['multi-columned'],
      placeholdersItem: [],
      headers: []
    }
  ]
  buttonConfig:NavButtonConfig=
    {
      label : '',
      placeholdersItem: [['Features','Solutions','Guides','Templates','Pricing']],
      headers: [],
      placeLabelContent: true,
      placeholdersContent: true,
    }
}
