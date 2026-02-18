import { LeaderboardEntryApiModel } from '../api/leaderboardEntry-api.model';
import { LeaderboardEntry } from '../domain/leaderboardEntry.model';
import { UserMapper } from './user.mapper';

export class LeaderboardEntryMapper {
  static fromApi(api: LeaderboardEntryApiModel): LeaderboardEntry {
    return {
      id: api.id,
      score: api.score,
      user: UserMapper.fromApi(api.personId),

    };
  }

  static toApi(leaderboardEntry: LeaderboardEntry): LeaderboardEntryApiModel {
    return {
      id: leaderboardEntry.id,
      score: leaderboardEntry.score,
      personId: UserMapper.toApi(leaderboardEntry.user),
    };
  }
}