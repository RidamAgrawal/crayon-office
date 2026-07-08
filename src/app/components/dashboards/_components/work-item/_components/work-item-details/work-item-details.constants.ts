import { OptionConfigurations, OptionsList } from "../../../../../../templates/option-wrapper/option-wrapper.model";

export const breadcrumbsChildren = [
    {
        text: 'Spaces',
    },
    {
        text: 'Demo Bug Tracking',
    },
    {
        text: 'Add Tracking',
    },
    {
        text: 'DBT-1',
    }
];

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