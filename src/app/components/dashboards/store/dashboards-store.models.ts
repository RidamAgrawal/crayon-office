import { User } from "../../../models";

export const DashboardsStoreKey = 'DashboardsStore';

export interface DashboardsState {
    userDetail: User | null;
}
