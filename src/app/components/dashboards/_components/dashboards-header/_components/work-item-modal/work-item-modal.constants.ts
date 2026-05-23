export const StatusLabels: Record<string, { label: string; color: string }> = {
    toDo: { label: 'To do', color: '#dddee1' },
    inProgress: { label: 'In progress', color: '#8fb8f6' },
    done: { label: 'Done', color: '#b3df72' },
};

export const StatusOptionsList = [
    {
        options: [
            {
                type: 'button',
                label: 'to do',
                id: 'toDo',
                visible: true,
                backgroundColor: '#dddee1'
            },
            {
                type: 'button',
                label: 'in progress',
                id: 'inProgress',
                visible: true,
                backgroundColor: '#8fb8f6'
            },
            {
                type: 'button',
                label: 'done',
                id: 'done',
                visible: true,
                backgroundColor: '#b3df72'
            }
        ]
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
            }
        ]
    }
];