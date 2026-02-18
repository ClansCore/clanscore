import { createAction, props } from '@ngrx/store';
import { Role } from '../../../core/models/domain/role.model';
import { AnnualPlanModel } from '../../../core/models/domain/annualPlan.model';
import { GamificationParameterApiModel } from '../../../core/models/api/gamificationParameter-api.model';

export const getRoles = createAction('[Role] GetRoles');
export const getRolesSuccess = createAction('[Role] GetRoles Success', props<{ roles: Role[] }>());
export const getRolesFailure = createAction('[Role] GetRoles Failure', props<{ error: string }>());

export const addRole = createAction('[Role] AddRole', props<{ role: Role }>());
export const addRoleSuccess = createAction('[Role] AddRole Success', props<{ role: Role }>());
export const addRoleFailure = createAction('[Role] AddRole Failure', props<{ error: string }>());

export const updateRole = createAction('[Role] UpdateRole', props<{ role: Role }>());
export const updateRoleSuccess = createAction('[Role] UpdateRole Success', props<{ role: Role }>());
export const updateRoleFailure = createAction('[Role] UpdateRole Failure', props<{ error: string }>());

export const deleteRole = createAction('[Role] DeleteRole', props<{ role: Role }>());
export const deleteRoleSuccess = createAction('[Role] DeleteRole Success', props<{ role: Role }>());
export const deleteRoleFailure = createAction('[Role] DeleteRole Failure', props<{ error: string }>());

// --------- AnnualPlan actions ---------
export const getAnnualPlans = createAction('[AnnualPlan] GetAnnualPlans');
export const getAnnualPlansSuccess = createAction('[AnnualPlan] GetAnnualPlans Success', props<{ annualPlans: AnnualPlanModel[] }>());
export const getAnnualPlansFailure = createAction('[AnnualPlan] GetAnnualPlans Failure', props<{ error: string }>());

export const updateAnnualPlan = createAction('[AnnualPlan] UpdateAnnualPlan', props<{ id: string; update: Partial<AnnualPlanModel> }>());
export const updateAnnualPlanSuccess = createAction('[AnnualPlan] UpdateAnnualPlan Success', props<{ annualPlan: AnnualPlanModel }>());
export const updateAnnualPlanFailure = createAction('[AnnualPlan] UpdateAnnualPlan Failure', props<{ error: string }>());

export const updateAmountAnnualPlan = createAction(
  '[AnnualPlan] Update Amount', props<{ id: string; newValue: number }>()
);
export const updateAmountAnnualPlanSuccess = createAction(
  '[AnnualPlan] Update Amount Success', props<{ annualPlan: AnnualPlanModel }>()
);
export const updateAmountAnnualPlanFailure = createAction(
  '[AnnualPlan] Update Amount Failure', props<{ error: string }>()
);

export const updateAmountPerActivityAnnualPlan = createAction(
  '[AnnualPlan] Update AmountPerActivity', props<{ id: string; newValue: number }>()
);
export const updateAmountPerActivityAnnualPlanSuccess = createAction(
  '[AnnualPlan] Update AmountPerActivity Success', props<{ annualPlan: AnnualPlanModel }>()
);
export const updateAmountPerActivityAnnualPlanFailure = createAction(
  '[AnnualPlan] Update AmountPerActivity Failure', props<{ error: string }>()
);

// --------- GamificationParameter actions ---------
export const getGamificationParameter = createAction('[Gamification] GetGamificationParameter');
export const getGamificationParameterSuccess = createAction('[Gamification] GetGamificationParameter Success', props<{ parameter: GamificationParameterApiModel }>());
export const getGamificationParameterFailure = createAction('[Gamification] GetGamificationParameter Failure', props<{ error: string }>());

export const updateGamificationParameterStart = createAction('[Gamification] UpdateGamificationParameter Start', props<{ gamificationParameter: Partial<GamificationParameterApiModel> }>());
export const updateGamificationParameterSuccess = createAction('[Gamification] UpdateGamificationParameter Success', props<{ gamificationParameter: Partial<GamificationParameterApiModel> }>());
export const UpdateGamificationParameterFailure = createAction('[Role] UpdateGamificationParameter Failure', props<{ error: string }>());