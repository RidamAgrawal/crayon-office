import { createReducer, on } from "@ngrx/store";
import { setSpaceBoardDetails, setSpaceDetails } from "./dashboard-space-store.actions";
import { SpaceDetails, SpaceStoreState } from "../_models";

export const dashboardSpaceInitialState: SpaceStoreState = {
    spaceDetails: {
        counter: 0,
        id: '',
        name: 'Space',
        key: '',
        icon: '',
        type: "JIRA",
        createdAt: '',
        updatedAt: '',
        template: 'kanban',
        ownerId: '',
        members: [],
        currentUser: { 
            can: {
                addPeople: false,
                deleteSpace: false,
                manageSettings: false,
                manageStatuses: false,
                setBackground: false,
            },
            role: 'VIEWER'
        },
        views: []
    },
    spaceBoardDetails: {
        columns: []
    }
}

export const dashboardSpaceReducer = createReducer(
    dashboardSpaceInitialState,
    on(setSpaceDetails, (state: SpaceStoreState, { spaceDetails }) => ({ ...state, spaceDetails })),
    on(setSpaceBoardDetails, (state: SpaceStoreState, { spaceBoardDetails }) => ({ ...state, spaceBoardDetails })),
);