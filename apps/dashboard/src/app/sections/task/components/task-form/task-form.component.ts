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
import { Task } from '../../../../core/models/domain/task.model';
import { Store } from '@ngrx/store';
import { TaskSelectors } from '../../store';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent {
  private store = inject(Store);
  readonly dialogRef = inject(MatDialogRef<TaskFormComponent>);
  readonly data = inject<{task: Task, title: string, confirmationText: string}>(MAT_DIALOG_DATA);
  taskTypes = this.store.selectSignal(TaskSelectors.selectTaskTypes);
  taskForm;
  isViewMode = false;
    
  constructor(private fb: FormBuilder) {
    // Check if this is view mode (confirmationText is "Ok")
    this.isViewMode = this.data.confirmationText === "Ok";
    this.taskForm = this.fb.nonNullable.group({
      id: [''],
      taskType: [''],
      name: ['', [Validators.required]],
      deadline: ['', [Validators.required]],
      description: ['', [Validators.required]],
      points: [0, [Validators.required]],
      maxParticipants: [0, [Validators.required]],
      createdBy: ['']
    });

    this.taskForm.patchValue({
      createdBy: this.data.task.createdBy,
    })

    if(!this.data.task.id) return;

    this.taskForm.patchValue({
      id: this.data.task.id,
      taskType: this.data.task.taskTypeId,
      name: this.data.task.name,
      description: this.data.task.description,
      points: this.data.task.points,
      deadline: this.data.task.deadline.toISOString(),
      maxParticipants: this.data.task.maxParticipants,
    });

    // Disable all fields in view mode
    if (this.isViewMode) {
      this.taskForm.disable();
    }
  }

  onSubmit(){
    // In view mode, just close the dialog without saving
    if (this.isViewMode) {
      this.dialogRef.close(false);
      return;
    }
    
    const formValue = this.taskForm.getRawValue();
    const updateTask : Task = {
      id: formValue.id,
      taskTypeId: formValue.taskType !== '' ? formValue.taskType : undefined,
      name: formValue.name,
      description: formValue.description,
      points: formValue.points,
      deadline: new Date(formValue.deadline),
      maxParticipants: formValue.maxParticipants,
      numberOfParticipants: this.data.task.numberOfParticipants,
      createdBy: formValue.createdBy,
      completed: false
    }
    console.log(updateTask);
    this.dialogRef.close(updateTask);
  }

  onCancel(){
    this.dialogRef.close(false);
  }

      
}
