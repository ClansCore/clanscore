import { Component, EventEmitter, input, Input, OnChanges, output, Output, signal, SimpleChanges } from '@angular/core';
import { User } from '../../../../core/models/domain/user.model';
import {MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../core/models/domain/role.model';
import { LeaderboardEntry } from '../../../../core/models/domain/leaderboardEntry.model';
import { PointHistory } from '../../../../core/models/domain/pointHistory.model';

@Component({
  selector: 'app-point-history-table',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatIconModule],
  templateUrl: './point-history-table.component.html',
  styleUrl: './point-history-table.component.scss'
})
export class PointHistoryTableComponent {
  displayedColumns: string[] = ['date', 'type', 'detail', 'score'];
  dataSource = signal<PointHistory[]>([]);

  @Input()
  set pointHistory(pointHistory: PointHistory[]){
    this.dataSource.set(pointHistory)
  }
}
