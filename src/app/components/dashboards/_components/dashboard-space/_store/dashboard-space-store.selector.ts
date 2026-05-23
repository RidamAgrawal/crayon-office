import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SpaceStoreKey, SpaceStoreState } from '../_models';

export const selectSpaceState =
  createFeatureSelector<SpaceStoreState>(SpaceStoreKey);
export const selectSpaceDetail = createSelector(
  selectSpaceState,
  (state) => state.spaceDetails,
);
export const selectSpaceBoardDetails = createSelector(
  selectSpaceState,
  (state) => state.spaceBoardDetails,
);
