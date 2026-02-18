import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { TaskType } from '../../../../core/models/domain/taskType.model';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-task-type-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogActions, MatDialogContent, MatSelectModule],
  templateUrl: './task-type-form.component.html',
  styleUrl: './task-type-form.component.scss'
})
export class TaskTypeFormComponent {
  readonly dialogRef = inject(MatDialogRef<TaskTypeFormComponent>);
  readonly data = inject<{taskType?: TaskType, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  taskTypeForm;

  constructor(private fb: FormBuilder) {
    this.taskTypeForm = this.fb.nonNullable.group({
      id: [''],
      name: ['', [Validators.required]],
      compensation: ['', [Validators.required]],
      points: [0, [Validators.required]],
      clubCostShare: [0, [Validators.required]],
    });
    console.log(this.data.taskType);
    if (this.data?.taskType) {
        console.log(this.data.taskType);
      this.taskTypeForm.patchValue(this.data.taskType);
    }
  }

  onSubmit() {
    const formValue = this.taskTypeForm.getRawValue();
    const result: TaskType = {
      id: formValue.id,
      name: formValue.name,
      compensation: formValue.compensation,
      points: formValue.points,
      clubCostShare: formValue.clubCostShare,
    };
    this.dialogRef.close(result);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
