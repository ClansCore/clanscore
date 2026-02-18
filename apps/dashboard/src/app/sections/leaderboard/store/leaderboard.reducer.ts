import { createReducer, on } from '@ngrx/store';
import { LeaderboardEntry } from '../../../core/models/domain/leaderboardEntry.model';
import { Leaderboard } from '../../../core/models/domain/leaderboard.model';
import { Reward } from '../../../core/models/domain/reward';
import { PointHistory } from '../../../core/models/domain/pointHistory.model';
import { LeaderboardActions } from '.';

export interface LeaderboardState {
  leaderboards: Leaderboard[];
  leaderboardEntries: LeaderboardEntry[];
  rewards: Reward[];
  points: number;
  pointHistory: PointHistory[]
  error: string | null;
  loading: boolean;
}

export const initialState: LeaderboardState = {
  leaderboards: [],
  leaderboardEntries: [],
  rewards: [],
  points: 0,
  pointHistory: [],
  error: null,
  loading: false,
};

export const leaderboardReducer = createReducer(
  initialState,
  on(LeaderboardActions.getLeaderboards, (state) => ({ ...state, loading: true })),
  on(LeaderboardActions.getLeaderboardsSuccess, (state, { leaderboards }) => ({
    ...state,
    loading: false,
    leaderboards,
  })),
  on(LeaderboardActions.getLeaderboardsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(LeaderboardActions.getLeaderboardEntries, (state) => ({ ...state, loading: true })),
  on(LeaderboardActions.getLeaderboardEntriesSuccess, (state, { entries }) => ({
    ...state,
    loading: false,
    leaderboardEntries: entries,
  })),
  on(LeaderboardActions.getLeaderboardEntriesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(LeaderboardActions.getRewards, (state) => ({ ...state, loading: true })),
  on(LeaderboardActions.getRewardsSuccess, (state, { rewards }) => ({
    ...state,
    loading: false,
    rewards,
  })),
  on(LeaderboardActions.getRewardsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(LeaderboardActions.getOwnPoints, (state) => ({ ...state, loading: true })),
  on(LeaderboardActions.getOwnPointsSuccess, (state, { points }) => ({
    ...state,
    loading: false,
    points,
  })),
  on(LeaderboardActions.getOwnPointsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(LeaderboardActions.getPointHistory, (state) => ({ ...state, loading: true })),
  on(LeaderboardActions.getPointHistorySuccess, (state, { history }) => ({
    ...state,
    loading: false,
    pointHistory: history,
  })),
  on(LeaderboardActions.getPointHistoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    pointHistory: [],
    error,
  })),
  on(LeaderboardActions.addRewardSuccess, (state, { reward }) => ({
      ...state,
      loading: false,
      rewards: [...state.rewards, reward],
    })),
  on(LeaderboardActions.updateRewardSuccess, (state, { reward }) => ({
    ...state,
    loading: false,
    rewards: state.rewards.map(r =>
      r.id === reward.id ? reward : r
    )
  })),
  on(LeaderboardActions.deleteRewardSuccess, (state, { reward }) => ({
    ...state,
    loading: false,
    rewards: state.rewards.filter(r => r.id !== reward.id)
  }))
);