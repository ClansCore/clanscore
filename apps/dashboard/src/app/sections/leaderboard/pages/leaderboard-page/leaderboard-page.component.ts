import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { LeaderboardInfoComponent } from '../../components/leaderboard-info/leaderboard-info.component';
import { LeaderboardTableComponent } from '../../components/leaderboard-table/leaderboard-table.component';
import { Store } from '@ngrx/store';
import { LeaderboardActions, LeaderboardSelectors } from '../../store';
import { AuthSelectors } from '../../../auth/store';
import { RewardTableComponent } from '../../components/reward-table/reward-table.component';
import { PointHistoryTableComponent } from '../../components/point-history-table/point-history-table.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Leaderboard } from '../../../../core/models/domain/leaderboard.model';
import { getLeaderboardEntries, getOwnPoints, getPointHistory } from '../../store/leaderboard.actions';
import { MatOptionModule } from '@angular/material/core';
import { NgFor } from '@angular/common';
import { User } from '../../../../core/models/domain/user.model';
import { UserActions, UserSelectors } from '../../../user/store';

@Component({
  selector: 'app-leaderboard-page',
  standalone: true,
  imports: [MatFormFieldModule,MatSelectModule,NgFor, MatOptionModule, LeaderboardInfoComponent, LeaderboardTableComponent, RewardTableComponent, PointHistoryTableComponent],
  templateUrl: './leaderboard-page.component.html',
  styleUrl: './leaderboard-page.component.scss'
})
export class LeaderboardPageComponent implements OnInit {

  private store = inject(Store);
  leaderboards = this.store.selectSignal(LeaderboardSelectors.selectLeaderboards);
  leaderboardEntries = this.store.selectSignal(LeaderboardSelectors.selectLeaderboardEntries);
  pointHistory = this.store.selectSignal(LeaderboardSelectors.selectPointHistory);
  ownPoints = this.store.selectSignal(LeaderboardSelectors.selectPoints);
  rewards = this.store.selectSignal(LeaderboardSelectors.selectRewards);
  loggedInUser = this.store.selectSignal(AuthSelectors.selectLoggedInUser);

  users = this.store.selectSignal(UserSelectors.selectUsers);
  selectedLeaderboard = signal<Leaderboard | null>(null);
  selectedUser = signal<User | null>(null);

  autoSelectLeaderboard = effect(
  () => {
    const lbs = this.leaderboards();
    if (lbs?.length && !this.selectedLeaderboard()) {
      const first = lbs[0];
      this.selectedLeaderboard.set(first);
      this.store.dispatch(getLeaderboardEntries({ leaderboard: first }));
    }
  },
  { allowSignalWrites: true }
);

autoSelectUser = effect(
  () => {
    const user = this.loggedInUser();
    if (user && !this.selectedUser()) {
      this.selectedUser.set(user);
      this.store.dispatch(getOwnPoints({ user }));
      this.store.dispatch(getPointHistory({ user }));
    }
  },
  { allowSignalWrites: true }
);

  ngOnInit(){
    this.store.dispatch(LeaderboardActions.getLeaderboards());
    this.store.dispatch(LeaderboardActions.getRewards());
    this.store.dispatch(UserActions.getAllUsers());
  }

  onLeaderboardChange(lb: Leaderboard) {
    this.selectedLeaderboard.set(lb);
    this.store.dispatch(getLeaderboardEntries({ leaderboard: lb }));
  }

  onUserChange(user: User) {
    this.selectedUser.set(user);
    this.store.dispatch(getOwnPoints({ user }));
    this.store.dispatch(getPointHistory({ user }));
  }

  compareUsers = (a: User | null, b: User | null) => a && b ? a.id === b.id : a === b;
  compareLeaderboards = (a: Leaderboard | null, b: Leaderboard | null) => 
    a && b ? a.id === b.id : a === b;

}
