import { createAction, props } from '@ngrx/store';
import { User } from '../../../core/models/domain/user.model';
import { Leaderboard } from '../../../core/models/domain/leaderboard.model';
import { LeaderboardEntry } from '../../../core/models/domain/leaderboardEntry.model';
import { PointHistory } from '../../../core/models/domain/pointHistory.model';
import { Reward } from '../../../core/models/domain/reward';

export const getLeaderboards = createAction('[Leaderboard] getLeaderboards');
export const getLeaderboardsSuccess = createAction('[Leaderboard] getLeaderboards Success', props<{ leaderboards: Leaderboard[]}>());
export const getLeaderboardsFailure = createAction('[Leaderboard] getLeaderboards Failure', props<{ error: string }>());

export const getLeaderboardEntries = createAction('[Leaderboard] getLeaderboardEntries', props<{leaderboard: Leaderboard}>());
export const getLeaderboardEntriesSuccess = createAction('[Leaderboard] getLeaderboardEntries Success', props<{entries: LeaderboardEntry[]}>());
export const getLeaderboardEntriesFailure = createAction('[Leaderboard] getLeaderboardEntries Failure', props<{error: string}>());

export const getOwnPoints = createAction('[Leaderboard] getOwnPoints', props<{user: User | null}>());
export const getOwnPointsSuccess = createAction('[Leaderboard] getOwnPoints Success', props<{ points: number }>());
export const getOwnPointsFailure = createAction('[Leaderboard] getOwnPoints Failure', props<{ error: string }>());

export const getPointHistory = createAction('[Leaderboard] getPointHistory', props<{user: User | null}>());
export const getPointHistorySuccess = createAction('[Leaderboard] getPointHistory Success', props<{ history: PointHistory[] }>());
export const getPointHistoryFailure = createAction('[Leaderboard] getPointHistory Failure', props<{ error: string }>());

export const getRewards = createAction('[Leaderboard] getRewards');
export const getRewardsSuccess = createAction('[Leaderboard] getRewards Success', props<{ rewards: Reward[] }>());
export const getRewardsFailure = createAction('[Leaderboard] getRewards Failure', props<{ error: string }>());

export const addReward = createAction('[Reward] AddReward', props<{ reward: Reward }>());
export const addRewardSuccess = createAction('[Reward] AddReward Success', props<{ reward: Reward }>());
export const addRewardFailure = createAction('[Reward] AddReward Failure', props<{ error: string }>());

export const updateReward = createAction('[Reward] EditReward', props<{ reward: Reward }>());
export const updateRewardSuccess = createAction('[Reward] EditReward Success', props<{ reward: Reward }>());
export const updateRewardFailure = createAction('[Reward] EditReward Failure', props<{ error: string }>());

export const deleteReward = createAction('[Reward] DeleteReward', props<{ reward: Reward }>());
export const deleteRewardSuccess = createAction('[Reward] DeleteReward Success', props<{ reward: Reward }>());
export const deleteRewardFailure = createAction('[Reward] DeleteReward Failure', props<{ error: string }>());