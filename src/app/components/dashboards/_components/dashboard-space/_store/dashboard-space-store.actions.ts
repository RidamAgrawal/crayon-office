import { createAction, props } from '@ngrx/store';
import { SpaceBoardDetails, SpaceDetails } from '../_models';

export const setSpaceDetails = createAction(
  '[app] set space details',
  props<{ spaceDetails: SpaceDetails }>(),
);
export const setSpaceBoardDetails = createAction(
  '[space] set space board details',
  props<{ spaceBoardDetails: SpaceBoardDetails }>(),
);
