import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { TaskType } from '../../../../core/models/domain/taskType.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GamificationParameterApiModel } from '../../../../core/models/api/gamificationParameter-api.model';

@Component({
  selector: 'app-points-example-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule],
  templateUrl: './points-example-table.component.html',
  styleUrl: './points-example-table.component.scss'
})
export class PointsExampleTableComponent implements OnChanges {
  @Input() taskTypes: TaskType[] = [];
  @Input() spendenTask!: TaskType;
  @Input() gamificationParameter?: GamificationParameterApiModel;

  displayedColumns = ['quelle', 'anzahl', 'punkte'];
  rows: { quelle: string; punkte: number; id: string; anzahl: number; points: number; isSpenden: boolean }[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskTypes'] || changes['spendenTask'] || changes['gamificationParameter']) {
      this.rows = [
        {
          id: 'spenden',
          quelle: this.spendenTask?.name ?? 'Spende',
          points: this.gamificationParameter?.pointsPerDonation ?? 1,
          anzahl: 0,
          punkte: 0,
          isSpenden: true
        },
        ...(this.taskTypes || []).map(t => ({
          id: t.id,
          quelle: t.name,
          points: t.points,
          anzahl: 0,
          punkte: 0,
          isSpenden: false
        }))
      ];
    }
  }

  updatePunkte(row: any) {
    if (row.isSpenden) {
      // For Spenden: multiply by pointsPerDonation from gamificationParameter
      row.punkte = (row.anzahl || 0) * (this.gamificationParameter?.pointsPerDonation ?? 1);
    } else {
      row.punkte = (row.anzahl || 0) * (row.points || 0);
    }
  }

  get totalPunkte() {
    return this.rows.reduce((sum, r) => sum + r.punkte, 0);
  }
}
