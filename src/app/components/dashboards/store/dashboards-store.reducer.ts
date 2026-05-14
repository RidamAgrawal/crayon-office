import { createReducer, on } from "@ngrx/store";
import { setUserDetails } from "./dashboards-store.actions"
import { DashboardsState } from "./dashboards-store.models";

export const dashboardsStoreInitialState: DashboardsState = {
    userDetail: null,
}
export const dashboardsStoreReducer = createReducer(
    dashboardsStoreInitialState,
    on(setUserDetails, (state: DashboardsState, { userDetail }) => ({ ...state, userDetail: userDetail }))
);
