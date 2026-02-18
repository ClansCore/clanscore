import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../core/models/domain/role.model';
import { LeaderboardEntry } from '../../../../core/models/domain/leaderboardEntry.model';

@Component({
  selector: 'app-leaderboard-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './leaderboard-table.component.html',
  styleUrl: './leaderboard-table.component.scss'
})
export class LeaderboardTableComponent {
  displayedColumns: string[] = ['rank', 'name', 'score'];
  dataSource = signal<LeaderboardEntry[]>([]);

  @Input()
  set leaderboardEntries(leaderboardEntries: LeaderboardEntry[]){
    this.dataSource.set(leaderboardEntries)
  }
}
