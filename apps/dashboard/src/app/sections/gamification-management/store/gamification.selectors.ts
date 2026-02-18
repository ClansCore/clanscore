import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './gamification.reducer';

export const selectGamificationState = createFeatureSelector<State>('gamification');

export const selectRoles = createSelector(
  selectGamificationState,
  (state) => state?.roles ?? []
);
export const selectRolesLoading = createSelector(selectGamificationState, (state) => state.rolesLoading);
export const selectRolesError = createSelector(selectGamificationState, (state) => state.rolesError);

export const selectAnnualPlans = createSelector(
  selectGamificationState,
  (state) => state?.annualPlans ?? []
);
export const selectAnnualPlansLoading = createSelector(selectGamificationState, (state) => state.annualPlansLoading);
export const selectAnnualPlansError = createSelector(selectGamificationState, (state) => state.annualPlansError);

export const selectGamificationParameter = createSelector(
  selectGamificationState,
  (state) => state?.gamificationParameter
);
export const selectGamificationParameterLoading = createSelector(selectGamificationState, (state) => state.gamificationParameterLoading);
export const selectGamificationParameterError = createSelector(selectGamificationState, (state) => state.gamificationParameterError);