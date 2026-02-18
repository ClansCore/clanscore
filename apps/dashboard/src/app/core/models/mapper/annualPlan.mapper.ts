import { AnnualPlanApiModel } from '../api/annualPlan-api.model';
import { AnnualPlanModel } from '../domain/annualPlan.model';
import { TaskTypeMapper } from './taskType.mapper';

export class AnnualPlanMapper {
  static fromApi(api: AnnualPlanApiModel): AnnualPlanModel {
    return {
      id: api.id,
      amount: api.amount,
      amountPerActivity: api.amountPerActivity,
      taskType: TaskTypeMapper.fromApi(api.taskType),
    };
  }
  static toApi(domain: AnnualPlanModel): AnnualPlanApiModel {
    return {
      id: domain.id,
      amount: domain.amount,
      amountPerActivity: domain.amountPerActivity,
      taskType: TaskTypeMapper.toApi(domain.taskType),
    };
  }
}
