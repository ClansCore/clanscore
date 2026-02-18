import { User } from "../domain/user.model";
import { UserApiModel } from "./user-api.model";

export interface PointHistoryApiModel {
  score: number;
  date: string;
  type: 'Donation' | 'Task' | 'Reward';
  typeDetail: string;
}