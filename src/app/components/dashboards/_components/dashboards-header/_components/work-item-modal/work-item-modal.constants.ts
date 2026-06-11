import {
  OptionsList,
  OptionConfigurations,
} from '../../../../../../templates/option-wrapper/option-wrapper.model';

export const StatusLabels: Record<string, { label: string; color: string }> = {
  TODO: { label: 'To do', color: '#dddee1' },
  IN_PROGRESS: { label: 'In progress', color: '#8fb8f6' },
  DONE: { label: 'Done', color: '#b3df72' },
};

export const StatusOptionsList: OptionsList[] = [
  {
    options: [
      {
        type: 'button',
        label: 'to do',
        id: 'toDo',
        visible: true,
        backgroundColor: '#dddee1',
      } as OptionConfigurations,
      {
        type: 'button',
        label: 'in progress',
        id: 'inProgress',
        visible: true,
        backgroundColor: '#8fb8f6',
      } as OptionConfigurations,
      {
        type: 'button',
        label: 'done',
        id: 'done',
        visible: true,
        backgroundColor: '#b3df72',
      } as OptionConfigurations,
    ],
  },
  {
    heading: 'Manage status',
    options: [
      {
        type: 'button',
        id: 'createStatus',
        label: 'Create status',
        visible: true,
      },
      {
        type: 'button',
        id: 'editStatus',
        label: 'Edit status',
        visible: true,
      },
    ],
  },
];

export const rippleStyle = {
  'animation-timing-function': 'cubic-bezier(.5, 0, 0, 1)',
  'animation-duration': '1.45s',
  'animation-name': 'rippleOne',
};
