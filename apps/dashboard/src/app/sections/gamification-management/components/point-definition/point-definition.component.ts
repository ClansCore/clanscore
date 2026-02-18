import { Component, Input, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { GamificationParameterApiModel } from '../../../../core/models/api/gamificationParameter-api.model';
import { AnnualPlanModel } from '../../../../core/models/domain/annualPlan.model';
import { Reward } from '../../../../core/models/domain/reward';
import { TaskType } from '../../../../core/models/domain/taskType.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-point-definition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatIconModule],
  templateUrl: './point-definition.component.html',
  styleUrl: './point-definition.component.scss'
})
export class PointDefinitionComponent implements OnChanges {
  @Input() gamificationParameter?: GamificationParameterApiModel;
  @Input() annualPlans: AnnualPlanModel[] = [];
  @Output() updateGamificationParameter = new EventEmitter<Partial<GamificationParameterApiModel>>();

  displayedColumns = ['bezeichnung', 'punkte', 'chfOhneKostenanteil', 'kostenanteil','chfMitKostenanteil', 'actions'];

  form: ReturnType<FormBuilder['group']>;

  /** Table config and data for Übersicht **/
  overviewColumns = ['bezeichnung', 'punkteProChf', 'chfPerPunkt'];
  get overviewData() {
    const p = this.gamificationParameter;
    return [
      {
        bezeichnung: 'Umrechnungskurs',
        punkteProChf: p?.pointsPerCHF ?? 0,
        chfPerPunkt: p?.pointsPerCHF ? (1 / p.pointsPerCHF) : 0,
        chfMitKostenanteil: null, // not relevant
      },
      {
        bezeichnung: 'Spende',
        punkteProChf: p?.pointsPerDonation ?? 0,
        chfPerPunkt: p?.pointsPerDonation ? (1 / p.pointsPerDonation) : 0,
        chfMitKostenanteil: null,
      }
    ];
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      pointsPerCHF: [0, [Validators.required, Validators.min(0)]],
      pointsPerDonation: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    if (this.gamificationParameter) {
      this.form.patchValue({
        pointsPerCHF: this.gamificationParameter.pointsPerCHF,
        pointsPerDonation: this.gamificationParameter.pointsPerDonation
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gamificationParameter'] && this.gamificationParameter) {
      this.form.patchValue({
        pointsPerCHF: this.gamificationParameter.pointsPerCHF,
        pointsPerDonation: this.gamificationParameter.pointsPerDonation
      });
    }
  }

  submit() {
    if (this.form.valid) {
      this.updateGamificationParameter.emit(this.form.value);
    }
  }

  getChfPerPunkt(plan: AnnualPlanModel): number {
    return this.gamificationParameter?.pointsPerCHF ? plan.taskType.points / this.gamificationParameter.pointsPerCHF : 0;
  }

  getChfWithCostShare(plan: AnnualPlanModel): number {
    const chfPerPunkt = this.getChfPerPunkt(plan);
    return chfPerPunkt * (plan.taskType.clubCostShare || 0) / 100;
  }

  @Output() editTasktype = new EventEmitter<TaskType>();

  @Output() deleteTasktype = new EventEmitter<TaskType>();

  @Output() addTasktype = new EventEmitter<void>();
}
