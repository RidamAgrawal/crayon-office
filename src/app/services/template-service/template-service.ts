import { Injectable } from '@angular/core';
import { DashboardRecent } from '../../components/dashboards/_components/dashboard-recent/dashboard-recent';
import { DashboardSearchBar } from '../../components/dashboards/_components/dashboard-search-bar/dashboard-search-bar';
import { Listing } from '../../templates/listing/listing';
import { JiraTab } from '../../templates/jira-tab/jira-tab/jira-tab';
import { CustomizeSidebar } from '../../components/dashboards/_components/dashboards-sidebar/_components/customize-sidebar/customize-sidebar';
import { FeedbackSidebar } from '../../components/dashboards/_components/dashboards-sidebar/_components/feedback-sidebar/feedback-sidebar';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  public templates: {[x: string]: any} ={
    'recent': DashboardRecent,
    'search-bar': DashboardSearchBar,
    'list': Listing,
    'jira-tab': JiraTab,
    'customize-sidebar': CustomizeSidebar,
    'feedback-sidebar': FeedbackSidebar,
  }
}
