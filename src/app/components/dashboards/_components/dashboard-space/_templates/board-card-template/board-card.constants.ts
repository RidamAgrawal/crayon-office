import { OptionListsConfig } from "../../../../../../templates/option-wrapper/option-wrapper.model";

export const cardMoreOptionButton: OptionListsConfig = {
    optionLists: [
        {
            options: [
                {
                    label: "Change status",
                    type: 'button',
                    id: 'changeStatus',
                    visible: true,
                }
            ]
        },
        {
            options: [
                {
                    label: "Copy link",
                    type: 'button',
                    id: 'copyLink',
                    visible: true,
                },
                {
                    label: "Copy key",
                    type: 'button',
                    id: 'copyKey',
                    visible: true,
                }
            ]
        },
        {
            options: [
                {
                    label: "Add flag",
                    type: 'button',
                    id: 'addFlag',
                    visible: true,
                },
                {
                    label: "Add label",
                    type: 'button',
                    id: 'addLabel',
                    visible: true,
                },
                {
                    label: "Link work item",
                    type: 'button',
                    id: 'linkWork',
                    visible: true,
                },
            ]
        },
        {
            options: [
                {
                    label: "Archive",
                    type: 'button',
                    id: 'archive',
                    visible: true,
                },
                {
                    label: "Delete",
                    type: 'button',
                    id: 'delete',
                    visible: true,
                }
            ]
        },
    ],
    optionHoverIndication: true
};