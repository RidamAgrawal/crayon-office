import { Component, input, InputSignal, output } from '@angular/core';
import { BreadCrumbsItem } from './models';
import { BreadCrumbsItemComponent } from './breadcrumbs-item.component';

@Component({
  selector: 'breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  imports: [BreadCrumbsItemComponent]
})
export class BreadCrumbsComponent {
  public children: InputSignal<BreadCrumbsItem[]> = input.required();
  public defaultExpanded: InputSignal<boolean> = input(false);
  public isExpanded: InputSignal<boolean> = input(false);
  public maxItems: InputSignal<number> = input(8);
  public itemsBeforeCollapse: InputSignal<number> = input(1);
  public itemsAfterCollapse: InputSignal<number> = input(1);

  public readonly onExpand = output<void>();
}
