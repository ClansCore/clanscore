import { effect, inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {LeaderboardActions} from '.';
import { catchError, filter, map, mergeMap, of, tap } from 'rxjs';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { Router } from '@angular/router';
import { LeaderboardApiService } from '../../../core/services/leaderboard-api.service';
import { Store } from '@ngrx/store';
import { AuthSelectors } from '../../auth/store';

@Injectable()
export class LeaderboardEffects {
  getRewards$;
  getLeaderboards$;
  getLeaderboardEntries$;
  getOwnPoints$;
  getPointHistory$;
  loadEntriesAfterLeaderboards$;
  addReward$;
  deleteReward$;
  updateReward$;
  private store = inject(Store);
  loggedInUser = this.store.selectSignal(AuthSelectors.selectLoggedInUser);

  constructor(private actions$: Actions, private leaderboardService: LeaderboardApiService, private router: Router) {
    effect(() => {
    let user = this.loggedInUser();
    if (!user) return;
    this.store.dispatch(LeaderboardActions.getOwnPoints({ user: user }));
    this.store.dispatch(LeaderboardActions.getPointHistory({ user: user }));
  }, { allowSignalWrites: true });
  
    this.getRewards$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.getRewards),
        mergeMap(() =>
          this.leaderboardService.getRewards().pipe(
            map(rewards => LeaderboardActions.getRewardsSuccess({ rewards })),
            catchError(error => of(LeaderboardActions.getRewardsFailure({ error: error.message || 'Failed to load rewards' })))
          )
        )
      )
    );

    this.getLeaderboards$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.getLeaderboards),
        mergeMap(() =>
          this.leaderboardService.getLeaderboards().pipe(
            map(leaderboards => LeaderboardActions.getLeaderboardsSuccess({ leaderboards })),
            catchError(error => of(LeaderboardActions.getLeaderboardsFailure({ error: error.message || 'Failed to load leaderboards' })))
          )
        )
      )
    );

    this.getLeaderboardEntries$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.getLeaderboardEntries),
        mergeMap((leaderboard) =>
          this.leaderboardService.getLeaderboardEntries(leaderboard.leaderboard).pipe(
            map(entries => LeaderboardActions.getLeaderboardEntriesSuccess({ entries })),
            catchError(error => of(LeaderboardActions.getLeaderboardEntriesFailure({ error: error.message || 'Failed to load entries' })))
          )
        )
      )
    );

    this.getOwnPoints$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.getOwnPoints),
        mergeMap((user) =>
          this.leaderboardService.getOwnPoints(user.user?.id).pipe(
            map(points => LeaderboardActions.getOwnPointsSuccess({ points })),
            catchError(error => of(LeaderboardActions.getOwnPointsFailure({ error: error.message || 'Failed to load points' })))
          )
        )
      )
    );

    this.getPointHistory$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.getPointHistory),
        mergeMap((user) =>
          this.leaderboardService.getPointHistory(user.user?.id).pipe(
            map(history => LeaderboardActions.getPointHistorySuccess({ history })),
            catchError(error => of(LeaderboardActions.getPointHistoryFailure({ error: error.message || 'Failed to load pointhistory' })))
          )
        )
      )
    );

  this.loadEntriesAfterLeaderboards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.getLeaderboardsSuccess),
      map(action => action.leaderboards[0]),
      filter(lb => !!lb),
      map(firstLb =>
        LeaderboardActions.getLeaderboardEntries({ leaderboard: firstLb })
      )
    )
  );

  this.addReward$ = createEffect(() =>
              this.actions$.pipe(
                ofType(LeaderboardActions.addReward),
                mergeMap((reward) =>
                  this.leaderboardService.addReward(reward.reward).pipe(
                    map((reward) => LeaderboardActions.addRewardSuccess({reward})),
                    catchError(error => of(LeaderboardActions.addRewardFailure({ error: error.message || 'Failed to add reward' })))
                  )
                )
              )
          );
      
  this.updateReward$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.updateReward),
        mergeMap((reward) =>
          this.leaderboardService.updateReward(reward.reward).pipe(
            map(reward => LeaderboardActions.updateRewardSuccess({reward})),
            catchError(error => of(LeaderboardActions.updateRewardFailure({ error: error.message || 'Failed to update reward' })))
          )
        )
      )
  );

  this.deleteReward$ = createEffect(() =>
      this.actions$.pipe(
        ofType(LeaderboardActions.deleteReward),
        mergeMap((reward) =>
          this.leaderboardService.deleteReward(reward.reward).pipe(
            map(reward => LeaderboardActions.deleteRewardSuccess({reward})),
            catchError(error => of(LeaderboardActions.deleteRewardFailure({ error: error.message || 'Failed to delete reward' })))
          )
        )
      )
  );
  
  }
}

