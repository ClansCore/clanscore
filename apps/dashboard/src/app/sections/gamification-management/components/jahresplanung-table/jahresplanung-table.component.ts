import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AnnualPlanModel } from '../../../../core/models/domain/annualPlan.model';
import { GamificationParameterApiModel } from '../../../../core/models/api/gamificationParameter-api.model';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as GamificationActions from '../../store/gamification.actions';

interface PlanInputState {
  amount: number;
  amountPerActivity: number;
}

interface TableRow {
  id: string;
  isSpende: boolean;
  taskTypeName: string;
  points: number;
  clubCostShare: number;
  plan?: AnnualPlanModel;
}

@Component({
  selector: 'app-jahresplanung-table',
  imports: [MatTableModule, CommonModule, MatIconModule, MatButtonModule, FormsModule],
  standalone: true,
  templateUrl: './jahresplanung-table.component.html',
  styleUrl: './jahresplanung-table.component.scss'
})
export class JahresplanungTableComponent implements OnInit, OnChanges {
  @Input() annualPlans: AnnualPlanModel[] = [];
  @Input() gamificationParameter?: GamificationParameterApiModel;

  readonly displayedColumns = ['taskType', 'amount', 'amountPerActivity', 'punkteProCHF', 'maxPunkte', 'vereinssaldo', 'vereinsaldoMitVereinskostenanteil'];

  // Local state to prevent re-rendering on every keystroke
  planInputs = new Map<string, PlanInputState>();
  
  // Combined data source with Spende row first
  tableRows: TableRow[] = [];

  constructor(private store: Store) {}

  ngOnInit() {
    // Initialize Spende row
    if (!this.planInputs.has('spende')) {
      this.planInputs.set('spende', { amount: 0, amountPerActivity: 0 });
    }
    this.buildTableRows();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['annualPlans'] && this.annualPlans) {
      // Sync local state with annualPlans (update existing, add new)
      this.annualPlans.forEach(plan => {
        if (plan.id) {
          const existing = this.planInputs.get(plan.id);
          // Only update if the value actually changed from backend (to avoid overwriting user input)
          if (!existing || existing.amount !== plan.amount || existing.amountPerActivity !== plan.amountPerActivity) {
            this.planInputs.set(plan.id, {
              amount: plan.amount,
              amountPerActivity: plan.amountPerActivity
            });
          }
        }
      });
      
      // Initialize Spende row if not exists
      if (!this.planInputs.has('spende')) {
        this.planInputs.set('spende', { amount: 0, amountPerActivity: 0 });
      }
    }
    
    // Rebuild table rows whenever annualPlans or gamificationParameter changes
    this.buildTableRows();
  }

  buildTableRows() {
    const rows: TableRow[] = [];
    
    // Add Spende row first
    rows.push({
      id: 'spende',
      isSpende: true,
      taskTypeName: 'Spende',
      points: this.gamificationParameter?.pointsPerDonation ?? 1,
      clubCostShare: 0
    });
    
    // Add annual plan rows
    this.annualPlans.forEach(plan => {
      rows.push({
        id: plan.id,
        isSpende: false,
        taskTypeName: plan.taskType.name,
        points: plan.taskType.points,
        clubCostShare: plan.taskType.clubCostShare,
        plan: plan
      });
    });
    
    this.tableRows = rows;
  }

  getPlanInput(planId: string): PlanInputState {
    return this.planInputs.get(planId) || { amount: 0, amountPerActivity: 0 };
  }

  get totalVereinssaldo(): number {
    let total = 0;
    
    // Add Spende contribution (positive)
    const spendeInput = this.getPlanInput('spende');
    const spendePoints = this.gamificationParameter?.pointsPerDonation ?? 1;
    total += spendeInput.amount * spendeInput.amountPerActivity * spendePoints / (this.gamificationParameter?.pointsPerCHF || 1);
    
    // Add annual plan contributions (negative)
    total += this.annualPlans.reduce((sum, plan) => {
      const input = this.getPlanInput(plan.id);
      return sum + (-1) * (input.amount * input.amountPerActivity * plan.taskType.points / (this.gamificationParameter?.pointsPerCHF || 1));
    }, 0);
    
    return total;
  }

  get totalVereinssaldoMitVereinskostenanteil(): number {
    let total = 0;
    
    // Add Spende contribution (positive, no clubCostShare)
    const spendeInput = this.getPlanInput('spende');
    const spendePoints = this.gamificationParameter?.pointsPerDonation ?? 1;
    total += spendeInput.amount * spendeInput.amountPerActivity * spendePoints / (this.gamificationParameter?.pointsPerCHF || 1);
    
    // Add annual plan contributions (negative)
    total += this.annualPlans.reduce((sum, plan) => {
      const input = this.getPlanInput(plan.id);
      return sum + (-1) * (input.amount * input.amountPerActivity * plan.taskType.points / (this.gamificationParameter?.pointsPerCHF || 1) * (plan.taskType.clubCostShare || 0) / 100);
    }, 0);
    
    return total;
  }

  updateAmountLocal(planId: string, newValue: number) {
    const current = this.getPlanInput(planId);
    this.planInputs.set(planId, { ...current, amount: newValue });
  }

  updateAmountPerActivityLocal(planId: string, newValue: number) {
    const current = this.getPlanInput(planId);
    this.planInputs.set(planId, { ...current, amountPerActivity: newValue });
  }

  updateAmount(row: TableRow) {
    // Spende row is not saved, just return
    if (row.isSpende) {
      return;
    }
    
    if (!row.plan?.id) {
      console.error('Plan ID is missing:', row);
      return;
    }
    const input = this.getPlanInput(row.plan.id);
    const newValue = Number(input.amount);
    if (isNaN(newValue)) {
      console.error('Invalid amount value:', input.amount);
      return;
    }
    this.store.dispatch(GamificationActions.updateAmountAnnualPlan({ id: row.plan.id, newValue }));
  }

  updateAmountPerActivity(row: TableRow) {
    // Spende row is not saved, just return
    if (row.isSpende) {
      return;
    }
    
    if (!row.plan?.id) {
      console.error('Plan ID is missing:', row);
      return;
    }
    const input = this.getPlanInput(row.plan.id);
    const newValue = Number(input.amountPerActivity);
    if (isNaN(newValue)) {
      console.error('Invalid amountPerActivity value:', input.amountPerActivity);
      return;
    }
    this.store.dispatch(GamificationActions.updateAmountPerActivityAnnualPlan({ id: row.plan.id, newValue }));
  }
}
