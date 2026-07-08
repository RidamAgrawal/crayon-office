import { TemplateRef } from "@angular/core";

export interface BreadCrumbsItem {
    text: string;
    href?: string;
    iconBefore?: TemplateRef<HTMLElement>;
    iconAfter?: TemplateRef<HTMLElement>;
    iconBeforeContext?: unknown;
    iconAfterContext?: unknown;
}