import type { TaskTypeDTO } from "./tasktype.dto";

export type AnnualPlanDTO = {
  id: string;
  amount: number;
  amountPerActivity: number;
  taskType: TaskTypeDTO;
};

export type AnnualPlanCreateDTO = Omit<AnnualPlanDTO, "id">;
export type AnnualPlanUpdateDTO = Partial<AnnualPlanDTO>;
