import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AnnualPlanApiService } from '../../../core/services/annual-plan-api.service';
import { GamificationParameterApiService } from '../../../core/services/gamification-parameter-api.service';
import * as GamificationActions from './gamification.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { AnnualPlanMapper } from '../../../core/models/mapper/annualPlan.mapper';
import { GamificationParameterMapper } from '../../../core/services/gamification-parameter-api.service';
import { LeaderboardActions } from '../../leaderboard/store';
import { TaskActions } from '../../task/store';

@Injectable()
export class GamificationEffects {
  getAnnualPlans$;
  updateAnnualPlan$;
  getGamificationParameter$;
  updateGamificationParameter$;
  reloadAfterGamParameterSuccess$;
  reloadAfterAddTaskTypeSuccess$;
  reloadAfterUpdateTaskTypeSuccess$;
  reloadAfterDeleteTaskTypeSuccess$;
  updateAmountAnnualPlan$;
  updateAmountPerActivityAnnualPlan$;
  reloadAfterUpdateAmountAnnualPlanSuccess$;

  constructor(
    private actions$: Actions,
    private annualPlanService: AnnualPlanApiService,
    private gamificationParameterService: GamificationParameterApiService
  ) {
    this.getAnnualPlans$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.getAnnualPlans),
        mergeMap(() =>
          this.annualPlanService.getAnnualPlans().pipe(
            map(apiList => GamificationActions.getAnnualPlansSuccess({ annualPlans: apiList.map(AnnualPlanMapper.fromApi) })),
            catchError(error => of(GamificationActions.getAnnualPlansFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );

    this.updateAnnualPlan$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateAnnualPlan),
        mergeMap(({ id, update }) =>
          this.annualPlanService.updateAnnualPlan(id, update).pipe(
            map(api => GamificationActions.updateAnnualPlanSuccess({ annualPlan: AnnualPlanMapper.fromApi(api) })),
            catchError(error => of(GamificationActions.updateAnnualPlanFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );

    this.getGamificationParameter$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.getGamificationParameter),
        mergeMap(() =>
          this.gamificationParameterService.getGamificationParameter().pipe(
            map(parameter => GamificationActions.getGamificationParameterSuccess({ parameter: GamificationParameterMapper.fromApi(parameter) })),
            catchError(error => of(GamificationActions.getGamificationParameterFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );

    this.updateGamificationParameter$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateGamificationParameterStart),
        mergeMap(({ gamificationParameter }) =>
          this.gamificationParameterService.updateGamificationParameter(gamificationParameter).pipe(
            map(api => GamificationActions.updateGamificationParameterSuccess({ gamificationParameter: GamificationParameterMapper.fromApi(api) })),
            catchError(error => of(GamificationActions.UpdateGamificationParameterFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );

    // After success, reload all data (parameter, annualPlans, rewards):
    this.reloadAfterGamParameterSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateGamificationParameterSuccess),
        mergeMap(() => [
          GamificationActions.getGamificationParameter(),
          GamificationActions.getAnnualPlans(),
          LeaderboardActions.getRewards()
        ])
      )
    );

    this.reloadAfterAddTaskTypeSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TaskActions.addTasktypeSuccess),
        mergeMap(() => [
          GamificationActions.getAnnualPlans(),
        ])
      )
    );

    this.reloadAfterUpdateTaskTypeSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TaskActions.updateTasktypeSuccess),
        mergeMap(() => [
          GamificationActions.getAnnualPlans(),
        ])
      )
    );

    this.reloadAfterDeleteTaskTypeSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TaskActions.deleteTasktypeSuccess),
        mergeMap(() => [
          GamificationActions.getAnnualPlans(),
        ])
      )
    );

    this.reloadAfterUpdateAmountAnnualPlanSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateAmountAnnualPlanFailure,
           GamificationActions.updateAmountPerActivityAnnualPlanFailure,
           GamificationActions.updateAmountAnnualPlanSuccess,
           GamificationActions.updateAmountPerActivityAnnualPlanSuccess
          ),
        mergeMap(() => [
          GamificationActions.getAnnualPlans(),
        ])
      )
    );

    this.reloadAfterDeleteTaskTypeSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TaskActions.deleteTasktypeSuccess),
        mergeMap(() => [
          GamificationActions.getAnnualPlans(),
        ])
      )
    );

    // Update Amount Effect
    this.updateAmountAnnualPlan$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateAmountAnnualPlan),
        mergeMap(({ id, newValue }) =>
          this.annualPlanService.updateAnnualPlan(id, { amount: newValue }).pipe(
            map(api => GamificationActions.updateAmountAnnualPlanSuccess({ annualPlan: AnnualPlanMapper.fromApi(api) })),
            catchError(error => of(GamificationActions.updateAmountAnnualPlanFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );
    // Update AmountPerActivity Effect
    this.updateAmountPerActivityAnnualPlan$ = createEffect(() =>
      this.actions$.pipe(
        ofType(GamificationActions.updateAmountPerActivityAnnualPlan),
        mergeMap(({ id, newValue }) =>
          this.annualPlanService.updateAnnualPlan(id, { amountPerActivity: newValue }).pipe(
            map(api => GamificationActions.updateAmountPerActivityAnnualPlanSuccess({ annualPlan: AnnualPlanMapper.fromApi(api) })),
            catchError(error => of(GamificationActions.updateAmountPerActivityAnnualPlanFailure({ error: error?.message || 'Unknown error' })))
          )
        )
      )
    );
  }
}