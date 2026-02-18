import { User } from "./user.model";

export interface PointHistory {
  score: number;
  date: Date;
  type: 'Donation' | 'Task' | 'Reward';
  typeDetail: string; 
}