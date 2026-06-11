import { createAction, props } from '@ngrx/store';
import { User } from '../../../models';

export const setUserDetails = createAction('[app] user detail', props<{ userDetail: User }>());
