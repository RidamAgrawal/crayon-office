import { createFeatureSelector, createSelector } from "@ngrx/store";
import { DashboardsState, DashboardsStoreKey } from "./dashboards-store.models";

export const selectDashboardsState = createFeatureSelector<DashboardsState>(DashboardsStoreKey);
export const selectUserDetail = createSelector(selectDashboardsState, (state) => state.userDetail);