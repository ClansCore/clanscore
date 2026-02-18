import { TaskTypeApiModel } from "./taskType-api.model";

export interface AnnualPlanApiModel {
  id: string;
  amount: number;
  amountPerActivity: number;
  taskType: TaskTypeApiModel;
}
