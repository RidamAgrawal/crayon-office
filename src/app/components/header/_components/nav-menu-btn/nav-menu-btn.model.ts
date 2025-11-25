import { MultiColumned, SingleColumned } from "../nav-dropdown/nav-dropdown.model";

export interface NavButtonConfig {
    label?: string;
    placeholdersItem?: SingleColumned | MultiColumned;
    headers?: string[];
    placeLabelContent?: boolean;
    placeholdersContent?: boolean;
}
