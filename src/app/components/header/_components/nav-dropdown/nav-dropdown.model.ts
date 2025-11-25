export interface NavDropdownConfig {
    label: string;
    type: NavDropdownConfigType;
    placeholdersItem?: SingleColumned | MultiColumned;
    headers?: string[];
}
export enum NavDropdownConfigType {
    'single-columned' = 0,
    'multi-columned' = 1,
    'multi-columned-with-heading' = 2,
}
export type SingleColumned = string[];
export type MultiColumned = SingleColumned[];