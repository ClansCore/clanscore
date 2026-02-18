import { UserApiModel } from "./user-api.model";

export interface LeaderboardEntryApiModel {
  id: string;
  score: number;
  personId: UserApiModel;
}