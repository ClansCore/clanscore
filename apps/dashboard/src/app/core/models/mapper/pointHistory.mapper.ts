import { PointHistoryApiModel } from '../api/pointHistory-api.model';
import { RoleApiModel } from '../api/role-api.model';
import { TaskTypeApiModel } from '../api/taskType-api.model';
import { UserApiModel } from '../api/user-api.model';
import { PointHistory } from '../domain/pointHistory.model';
import { Role } from '../domain/role.model';
import { TaskType } from '../domain/taskType.model';
import { User } from '../domain/user.model';
import { UserMapper } from './user.mapper';

export class PointHistoryMapper {
  static fromApi(api: PointHistoryApiModel): PointHistory {
    return {
      score: api.score,
      date: new Date(api.date),
      type: api.type,
      typeDetail: api.typeDetail
    };
  }

  static toApi(pointHistory: PointHistory): PointHistoryApiModel {
    return {
      score: pointHistory.score,
      date: pointHistory.date.toISOString(),
      type: pointHistory.type,
      typeDetail: pointHistory.typeDetail
    };
  }
}