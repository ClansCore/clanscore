import { TaskType } from "./taskType.model";

export interface AnnualPlanModel {
  id: string;
  amount: number;
  amountPerActivity: number;
  taskType: TaskType;
}
