import { LeaderboardApiModel } from '../api/leaderboard-api.model';
import { RoleApiModel } from '../api/role-api.model';
import { TaskTypeApiModel } from '../api/taskType-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Leaderboard } from '../domain/leaderboard.model';
import { Role } from '../domain/role.model';
import { TaskType } from '../domain/taskType.model';
import { User } from '../domain/user.model';

export class LeaderboardMapper {
  static fromApi(api: LeaderboardApiModel): Leaderboard {
    return {
      id: api.id,
      name: api.name,
      description: api.description,
      startDate: new Date(api.startDate),
      endDate: new Date(api.endDate),
      numberVisibleEntries: api.numberVisibleEntries

    };
  }

  static toApi(leaderboard: Leaderboard): LeaderboardApiModel {
    return {
      id: leaderboard.id,
      name: leaderboard.name,
      description: leaderboard.description,
      startDate: leaderboard.startDate.toISOString(),
      endDate: leaderboard.endDate.toISOString(),
      numberVisibleEntries: leaderboard.numberVisibleEntries
    };
  }
}