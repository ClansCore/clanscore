import { RoleApiModel } from '../api/role-api.model';
import { TaskTypeApiModel } from '../api/taskType-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Role } from '../domain/role.model';
import { TaskType } from '../domain/taskType.model';
import { User } from '../domain/user.model';

export class TaskTypeMapper {
  static fromApi(api: TaskTypeApiModel): TaskType {
    return {
      id: api.id,
      name: api.name,
      compensation: api.compensation,
      points: api.points,
      clubCostShare: api.clubCostShare,

    };
  }

  static toApi(taskType: TaskType): TaskTypeApiModel {
    return {
      id: taskType.id,
      name: taskType.name,
      compensation: taskType.compensation,
      points: taskType.points,
      clubCostShare: taskType.clubCostShare,
    };
  }
}