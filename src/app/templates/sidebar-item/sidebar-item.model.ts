export interface SidebarItem {
  type: 'link' | 'modal' | 'group';
  title: string;
  icon: string;
  visible: boolean;
  hasTools?: boolean;
  disableHoverAnimation?: boolean;
  defaultTools?: Tool[];
  hoverTools?: Tool[];
  list?: SidebarItem[];
  multiplelists?: { heading: string; list: SidebarItem[] }[];
}

export interface Tool {
  icon?: string;
  alt?: string;
}
