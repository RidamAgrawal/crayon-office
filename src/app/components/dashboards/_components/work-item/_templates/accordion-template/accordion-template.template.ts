import { NgTemplateOutlet } from "@angular/common";
import { Component, input, signal, TemplateRef } from "@angular/core";

@Component({
    selector: 'accordion-template',
    templateUrl: './accordion-template.template.html',
    styleUrl: './accordion-template.template.scss',
    imports: [NgTemplateOutlet]
})
export class AccordionTemplate {
    public readonly bodyTemplateRef = input.required<TemplateRef<HTMLElement>>();
    public readonly bodyTemplateRefContext = input<unknown>();
    public readonly accordionTitle = input.required<string>();
    public readonly accordionTitleRef = input<TemplateRef<HTMLElement>>();
    public readonly accordionTitleRefContext = input<unknown>();

    protected readonly showAccordionBody = signal<boolean>(false);

    protected toggle(): void {
        this.showAccordionBody.update(prev => !prev);
    }
}