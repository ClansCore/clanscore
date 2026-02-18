import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { Reward } from "../models/domain/reward";
import { RewardApiModel } from "../models/api/reward-api";
import { RewardMapper } from "../models/mapper/reward.mapper";
import { Leaderboard } from "../models/domain/leaderboard.model";
import { LeaderboardApiModel } from "../models/api/leaderboard-api.model";
import { LeaderboardMapper } from "../models/mapper/leaderboard.mapper";
import { LeaderboardEntry } from "../models/domain/leaderboardEntry.model";
import { LeaderboardEntryApiModel } from "../models/api/leaderboardEntry-api.model";
import { LeaderboardEntryMapper } from "../models/mapper/leaderboardEntry.mapper";
import { User } from "../models/domain/user.model";
import { UserMapper } from "../models/mapper/user.mapper";
import { PointHistory } from "../models/domain/pointHistory.model";
import { PointHistoryMapper } from "../models/mapper/pointHistory.mapper";
import { PointHistoryApiModel } from "../models/api/pointHistory-api.model";

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getRewards(): Observable<Reward[]> {
    return this.http.get<RewardApiModel[]>(`${this.apiUrl}/rewards`).pipe(
      map(reward => reward.map(RewardMapper.fromApi))
    );
  }

  getLeaderboards(): Observable<Leaderboard[]> {
    return this.http.get<LeaderboardApiModel[]>(`${this.apiUrl}/leaderboards`).pipe(
      map(leaderboard => leaderboard.map(LeaderboardMapper.fromApi))
    );
  }

  getLeaderboardEntries(selectedLeaderboard: Leaderboard): Observable<LeaderboardEntry[]> {
    const leaderboard = LeaderboardMapper.toApi(selectedLeaderboard);
    return this.http.post<LeaderboardEntryApiModel[]>(`${this.apiUrl}/leaderboards/${leaderboard.id}/entries`, {leaderboard}).pipe(
      map(leaderboardEntry => leaderboardEntry.map(LeaderboardEntryMapper.fromApi))
    );
  }

  getOwnPoints(userId: string | undefined): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/points`).pipe(
      map(points => points)
    );
  }

  getPointHistory(userId: string | undefined): Observable<PointHistory[]> {
    return this.http.get<PointHistoryApiModel[]>(`${this.apiUrl}/user/${userId}/points/history`).pipe(
      map(pointHistory => pointHistory.map(PointHistoryMapper.fromApi))
    );
  }

  updateReward(updateReward: Reward): Observable<Reward> {
      const reward = RewardMapper.toApi(updateReward);
      return this.http.patch<RewardApiModel>(`${this.apiUrl}/rewards/${reward.id}`, {reward}).pipe(
        map(reward => updateReward)
      );
    }
  
    deleteReward(deleteReward: Reward): Observable<Reward> {
      const reward = RewardMapper.toApi(deleteReward);
      return this.http.delete<RewardApiModel>(`${this.apiUrl}/rewards/${reward.id}`).pipe(
        map((task) => deleteReward)
      );
    }

    addReward(addReward: Reward): Observable<Reward> {
      const reward = RewardMapper.toApi(addReward);
        return this.http.post<RewardApiModel>(`${this.apiUrl}/rewards`, {reward}).pipe(
          map(reward => RewardMapper.fromApi(reward))
        );
    }


}