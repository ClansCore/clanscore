import { Leaderboard } from "./leaderboard.model";
import { User } from "./user.model";

export interface LeaderboardEntry {
  id: string;
  score: number;
  user: User;
}