import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../core/models/domain/role.model';
import { LeaderboardEntry } from '../../../../core/models/domain/leaderboardEntry.model';
import { Reward } from '../../../../core/models/domain/reward';

@Component({
  selector: 'app-reward-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './reward-table.component.html',
  styleUrl: './reward-table.component.scss'
})
export class RewardTableComponent {
  displayedColumns: string[] = ['name', 'score', 'actions'];
  dataSource = signal<Reward[]>([]);

  @Input()
  set rewards(rewards: Reward[]){
    this.dataSource.set(rewards)
  }
}
