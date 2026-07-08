import { NgTemplateOutlet } from "@angular/common";
import { Component, input, TemplateRef } from "@angular/core";

@Component({
  selector: 'breadcrumbs-item',
  templateUrl: './breadcrumbs-item.component.html',
  styleUrl: './breadcrumbs-item.component.scss',
  imports: [NgTemplateOutlet],
})
export class BreadCrumbsItemComponent {
    public text = input.required<string>();
    public href = input<string>();
    public iconBefore = input<TemplateRef<HTMLElement>>();
    public iconBeforeContext = input<unknown>();
    public iconAfter = input<TemplateRef<HTMLElement>>();
    public iconAfterContext = input<unknown>();
}
