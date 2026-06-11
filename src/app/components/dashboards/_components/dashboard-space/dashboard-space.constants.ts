import {
  OptionConfigurations,
  OptionsList,
} from '../../../../templates/option-wrapper/option-wrapper.model';
import { SpaceCapabilities, SpaceView } from './_models';

type CapKey = keyof SpaceCapabilities;

export const SPACE_MENU: { id: string; icon: string; label: string; requires?: CapKey }[] = [
  { id: 'addToStarred', icon: 'starred', label: 'Add to starred' },
  { id: 'addPeople', icon: 'personAdd', label: 'Add people', requires: 'addPeople' },
  {
    id: 'setBackground',
    icon: 'textColor',
    label: 'Set space background',
    requires: 'setBackground',
  },
  { id: 'spaceSettings', icon: 'settings', label: 'Space settings', requires: 'manageSettings' },
  { id: 'deleteSpace', icon: 'hide', label: 'Delete space', requires: 'deleteSpace' },
];

export const VIEW_TYPE_UI: Record<SpaceView['type'], { icon: string; routerLink: string }> = {
  BOARD: { icon: 'dashboards', routerLink: 'board' },
  LIST: { icon: 'list', routerLink: 'list' },
  CALENDAR: { icon: 'calendar', routerLink: 'calendar' },
  TIMELINE: { icon: 'timeline', routerLink: 'timeline' },
  SUMMARY: { icon: 'summary', routerLink: 'summary' },
  FORM: { icon: 'form', routerLink: 'form' },
  CODE: { icon: 'code', routerLink: 'code' },
};

export const PER_TAB_OPTIONS: OptionsList[] = [
  {
    options: [
      {
        id: 'rename',
        icon: 'editSquare',
        label: 'Rename',
        type: 'button',
        visible: true,
      },
      {
        id: 'moveLeft',
        icon: 'moveGroupLeft',
        label: 'Move to left',
        type: 'button',
        visible: true,
      },
      {
        id: 'moveRight',
        icon: 'moveGroupRight',
        label: 'Move to right',
        type: 'button',
        visible: true,
      },
    ],
  },
];

export function toOption(item: { id: string; icon: string; label: string }): OptionConfigurations {
  return {
    id: item.id,
    icon: item.icon,
    label: item.label,
    type: 'button',
    visible: true,
  };
}
