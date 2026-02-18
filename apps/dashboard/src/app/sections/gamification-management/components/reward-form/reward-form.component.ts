import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Reward } from '../../../../core/models/domain/reward';

@Component({
  selector: 'app-reward-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent
  ],
  templateUrl: './reward-form.component.html',
  styleUrl: './reward-form.component.scss'
})
export class RewardFormComponent {
  readonly dialogRef = inject(MatDialogRef<RewardFormComponent>);
  readonly data = inject<{reward: Reward, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  rewardForm;
    
  constructor(private fb: FormBuilder) {
    this.rewardForm = this.fb.nonNullable.group({
      id: [''],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      pointCost: [0, [Validators.required]],
      clubCostShare: [0],
    });

    if(!this.data.reward) return;

    this.rewardForm.patchValue({
      id: this.data.reward.id,
      name: this.data.reward.name,
      description: this.data.reward.description,
      pointCost: this.data.reward.pointCost,
      clubCostShare: this.data.reward.clubCostShare,
    })
  }

  onSubmit(){
    const formValue = this.rewardForm.getRawValue();
    const updateReward : Reward = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      pointCost: formValue.pointCost,
      clubCostShare: formValue.clubCostShare,
    }
    this.dialogRef.close(updateReward);
  }

  onCancel(){
    this.dialogRef.close(false);
  }

      
}
