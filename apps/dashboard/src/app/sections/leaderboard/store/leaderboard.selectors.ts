import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LeaderboardState } from './leaderboard.reducer';

export const selectLeaderboardState = createFeatureSelector<LeaderboardState>('leaderboard');

export const selectRewards = createSelector(selectLeaderboardState, (state) => state.rewards);
export const selectLeaderboards = createSelector(selectLeaderboardState, (state) => state.leaderboards)
export const selectLeaderboardEntries = createSelector(selectLeaderboardState, (state) => state.leaderboardEntries)
export const selectPoints = createSelector(selectLeaderboardState, (state) => state.points);
export const selectPointHistory = createSelector(selectLeaderboardState, (state) => state.pointHistory);
export const selectLeaderboardError = createSelector(selectLeaderboardState, (state) => state.error);
export const selectLeaderboardLoading = createSelector(selectLeaderboardState, (state) => state.loading);