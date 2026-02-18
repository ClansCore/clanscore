import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../core/models/domain/role.model';
import { LeaderboardEntry } from '../../../../core/models/domain/leaderboardEntry.model';
import { Reward } from '../../../../core/models/domain/reward';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reward-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './reward-table.component.html',
  styleUrl: './reward-table.component.scss'
})
export class GamificationRewardTableComponent {
  displayedColumns: string[] = ['name', 'score', 'clubCostShare', 'actions'];
  dataSource = signal<Reward[]>([]);

  @Input()
  set rewards(rewards: Reward[]){
    this.dataSource.set(rewards)
  }

  @Output() editReward = new EventEmitter<Reward>();

  @Output() deleteReward = new EventEmitter<Reward>();

  @Output() addReward = new EventEmitter();
}
