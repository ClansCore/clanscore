export type TaskTypeDTO = {
  id: string;
  name: string;
  compensation?: "Single" | "Expense";
  points: number;
  clubCostShare?: number | null;
};
