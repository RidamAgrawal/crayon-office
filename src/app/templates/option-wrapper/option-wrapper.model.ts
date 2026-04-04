import { ElementRef, TemplateRef } from "@angular/core";

export interface OptionConfigurations {
    type: 'link' | 'button';
    icon?: string;
    label: string;
    id?: string;
    visible?: boolean;
    disabled?: boolean;
    elementRef?: ElementRef;
    contentTemplateRef?: TemplateRef<any>;
    contentElementRef?: ElementRef;
}

export interface OptionsList {
    options: OptionConfigurations[];
    heading?: string;
    disabled?: boolean;
}

export interface OptionListsConfig {
    optionLists: OptionsList[];
    optionHoverIndication?: boolean;
    handleOptionEvent?: (option: OptionConfigurations) => void;
}