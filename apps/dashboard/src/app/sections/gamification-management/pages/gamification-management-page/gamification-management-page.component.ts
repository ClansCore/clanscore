import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { GamificationRewardTableComponent } from '../../components/reward-table/reward-table.component';
import { JahresplanungTableComponent } from '../../components/jahresplanung-table/jahresplanung-table.component';
import { LeaderboardActions, LeaderboardSelectors } from '../../../leaderboard/store';
import { Reward } from '../../../../core/models/domain/reward';
import { MatDialog } from '@angular/material/dialog';
import { RewardFormComponent } from '../../components/reward-form/reward-form.component';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';
import { selectAnnualPlans, selectGamificationParameter } from '../../store/gamification.selectors';
import * as GamificationActions from '../../store/gamification.actions';
import { PointDefinitionComponent } from '../../components/point-definition/point-definition.component';
import { GamificationParameterApiModel } from '../../../../core/models/api/gamificationParameter-api.model';
import { TaskTypeFormComponent } from '../../components/task-type-form/task-type-form.component';
import { TaskType } from '../../../../core/models/domain/taskType.model';
import { TaskActions } from '../../../task/store';
import { PointsExampleTableComponent } from '../../components/points-example-table/points-example-table.component';

@Component({
  selector: 'app-gamification-management-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTabsModule, GamificationRewardTableComponent, JahresplanungTableComponent, PointDefinitionComponent, PointsExampleTableComponent],
  templateUrl: './gamification-management-page.component.html',
  styleUrl: './gamification-management-page.component.scss'
})
export class GamificationManagementPageComponent implements OnInit {
  private store = inject(Store);
  readonly dialog = inject(MatDialog);
  rewards = this.store.selectSignal(LeaderboardSelectors.selectRewards);
  annualPlans = this.store.selectSignal(selectAnnualPlans);
  gamificationparameter = this.store.selectSignal(selectGamificationParameter);
  
  // Plain fields - NO GETTERS
  taskTypes: TaskType[] = [];
  spendenTask: TaskType = { id: 'spenden', name: 'Spenden', compensation: 'Single', points: 1, clubCostShare: 0 };

  constructor() {
    // Use effect() to react to signal changes - this is the correct way with signals
    effect(() => {
      const plans = this.annualPlans();
      if (plans) {
        this.taskTypes = plans
          .map(p => p.taskType)
          .filter((t, i, arr) => t && arr.findIndex(tt => tt.id === t.id) === i);
      } else {
        this.taskTypes = [];
      }
    });
  }

  ngOnInit() {
    this.store.dispatch(LeaderboardActions.getRewards());
    this.store.dispatch(GamificationActions.getAnnualPlans());
    this.store.dispatch(GamificationActions.getGamificationParameter());
  }

  addReward() {
    let dialogRef = this.dialog.open(RewardFormComponent, { data: { title: "Belohnung Hinzufügen", confirmationText: "Hinzufügen" }, minWidth: '700px' });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(LeaderboardActions.addReward({ reward: result }));
    });
  }

  editReward(reward: Reward) {
    let dialogRef = this.dialog.open(RewardFormComponent, { data: { reward: reward, title: 'Belohnung Bearbeiten', confirmationText: "Bearbeiten" }, minWidth: '700px' });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(LeaderboardActions.updateReward({ reward: result }));
    });
  }

  deleteReward(reward: Reward) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Belohnung ${reward.name} Löschen` });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.store.dispatch(LeaderboardActions.deleteReward({ reward: reward }));
    });
  }

  updateGamificationParameter(gamificationParameter: Partial<GamificationParameterApiModel>) {
    this.store.dispatch(
      GamificationActions.updateGamificationParameterStart({ gamificationParameter })
    );
  }

  editTasktype(taskType: TaskType) {
    let dialogRef = this.dialog.open(TaskTypeFormComponent, { data: { taskType, title: 'Aufgabentyp Bearbeiten', confirmationText: 'Bearbeiten' }, minWidth: '700px' });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(TaskActions.updateTasktype({ tasktype: result }));
    });
  }

  deleteTasktype(taskType: TaskType) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Aufgabentyp ${taskType.name} Löschen` });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.store.dispatch(TaskActions.deleteTasktype({ tasktype: taskType }));
    });
  }

  addTasktype() {
    let dialogRef = this.dialog.open(TaskTypeFormComponent, {
      data: { title: 'Aufgabentyp Hinzufügen', confirmationText: 'Hinzufügen' },
      minWidth: '700px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.store.dispatch(TaskActions.addTasktype({ tasktype: result }));
    });
  }
}
