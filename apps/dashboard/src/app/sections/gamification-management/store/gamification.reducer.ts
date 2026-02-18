import { createReducer, on } from '@ngrx/store';
import * as GamificationActions from './gamification.actions';
import { Role } from '../../../core/models/domain/role.model';
import { AnnualPlanModel } from '../../../core/models/domain/annualPlan.model';
import { GamificationParameterApiModel } from '../../../core/models/api/gamificationParameter-api.model';

export interface State {
  roles: Role[];
  rolesLoading: boolean;
  rolesError?: string;
  annualPlans: AnnualPlanModel[];
  annualPlansLoading: boolean;
  annualPlansError?: string;
  gamificationParameter?: GamificationParameterApiModel; // now a single object, not array
  gamificationParameterLoading: boolean;
  gamificationParameterError?: string;
}

export const initialState: State = {
  roles: [],
  rolesLoading: false,
  rolesError: undefined,
  annualPlans: [],
  annualPlansLoading: false,
  annualPlansError: undefined,
  gamificationParameter: undefined,
  gamificationParameterLoading: false,
  gamificationParameterError: undefined,
};

export const gamificationReducer = createReducer(
  initialState,
  // Roles handlers...
  on(GamificationActions.getRoles, (state) => ({ ...state, rolesLoading: true, rolesError: undefined })),
  on(GamificationActions.getRolesSuccess, (state, { roles }) => ({ ...state, roles, rolesLoading: false })),
  on(GamificationActions.getRolesFailure, (state, { error }) => ({ ...state, rolesLoading: false, rolesError: error })),

  on(GamificationActions.addRole, (state) => state),
  on(GamificationActions.addRoleSuccess, (state, { role }) => ({ ...state, roles: [...state.roles, role] })),
  on(GamificationActions.addRoleFailure, (state, { error }) => ({ ...state, rolesError: error })),

  on(GamificationActions.updateRole, (state) => state),
  on(GamificationActions.updateRoleSuccess, (state, { role }) => ({
    ...state,
    roles: state.roles.map((r) => (r.id === role.id ? role : r)),
  })),
  on(GamificationActions.updateRoleFailure, (state, { error }) => ({ ...state, rolesError: error })),

  on(GamificationActions.deleteRoleSuccess, (state, { role }) => ({
    ...state,
    roles: state.roles.filter((r) => r.id !== role.id),
  })),
  // ------- AnnualPlans handlers -------
  on(GamificationActions.getAnnualPlans, (state) => ({ ...state, annualPlansLoading: true, annualPlansError: undefined })),
  on(GamificationActions.getAnnualPlansSuccess, (state, { annualPlans }) => ({ ...state, annualPlans, annualPlansLoading: false })),
  on(GamificationActions.getAnnualPlansFailure, (state, { error }) => ({ ...state, annualPlansLoading: false, annualPlansError: error })),

  on(GamificationActions.updateAnnualPlan, (state) => state),
  on(GamificationActions.updateAnnualPlanSuccess, (state, { annualPlan }) => ({
    ...state,
    annualPlans: state.annualPlans.map((ap) => (ap.id === annualPlan.id ? annualPlan : ap)),
  })),
  on(GamificationActions.updateAnnualPlanFailure, (state, { error }) => ({ ...state, annualPlansError: error })),

  on(GamificationActions.updateAmountAnnualPlanSuccess, (state, { annualPlan }) => ({
    ...state,
    annualPlans: state.annualPlans.map(ap => ap.id === annualPlan.id ? annualPlan : ap),
  })),
  on(GamificationActions.updateAmountAnnualPlanFailure, (state, { error }) => ({
    ...state,
    annualPlansError: error
  })),
  on(GamificationActions.updateAmountPerActivityAnnualPlanSuccess, (state, { annualPlan }) => ({
    ...state,
    annualPlans: state.annualPlans.map(ap => ap.id === annualPlan.id ? annualPlan : ap),
  })),
  on(GamificationActions.updateAmountPerActivityAnnualPlanFailure, (state, { error }) => ({
    ...state,
    annualPlansError: error
  })),
  // ------- GamificationParameter handlers -------
  on(GamificationActions.getGamificationParameter, (state) => ({
    ...state,
    gamificationParameterLoading: true,
    gamificationParameterError: undefined,
  })),
  on(GamificationActions.getGamificationParameterSuccess, (state, { parameter }) => ({
    ...state,
    gamificationParameter: parameter,
    gamificationParameterLoading: false
  })),
  on(GamificationActions.getGamificationParameterFailure, (state, { error }) => ({
    ...state,
    gamificationParameterLoading: false,
    gamificationParameterError: error
  })),
);