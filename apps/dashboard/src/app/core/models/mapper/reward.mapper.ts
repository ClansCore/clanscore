import { RewardApiModel } from '../api/reward-api';
import { RoleApiModel } from '../api/role-api.model';
import { TaskTypeApiModel } from '../api/taskType-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Reward } from '../domain/reward';
import { Role } from '../domain/role.model';
import { TaskType } from '../domain/taskType.model';
import { User } from '../domain/user.model';

export class RewardMapper {
  static fromApi(api: RewardApiModel): Reward {
    return {
      id: api.id,
      name: api.name,
      description: api.description,
      pointCost: api.pointsCost,
      clubCostShare: api.clubCostShare,

    };
  }

  static toApi(reward: Reward): RewardApiModel {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointCost,
      clubCostShare: reward.clubCostShare,
    };
  }
}