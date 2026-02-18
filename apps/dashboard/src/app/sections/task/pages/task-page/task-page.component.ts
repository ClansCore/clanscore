import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskActions, TaskSelectors } from '../../store';
import { TaskTableComponent } from '../../components/task-table/task-table.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TaskFormComponent } from '../../components/task-form/task-form.component';
import { AuthSelectors } from '../../../auth/store';
import { Task } from '../../../../core/models/domain/task.model';
import { ConfirmationDialogComponent } from '../../../../core/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-task-page',
  standalone: true,
  imports: [TaskTableComponent, TaskFormComponent, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './task-page.component.html',
  styleUrl: './task-page.component.scss'
})
export class TaskPageComponent implements OnInit {
  private store = inject(Store);
  readonly dialog = inject(MatDialog);
  tasks = this.store.selectSignal(TaskSelectors.selectTasks);
  loading = this.store.selectSignal(TaskSelectors.selectTasksLoading);
  loggedInUser = this.store.selectSignal(AuthSelectors.selectLoggedInUser);
  
  ngOnInit() {
      this.store.dispatch(TaskActions.getTasks());
      this.store.dispatch(TaskActions.getTaskTypes());
  }

  addTask(){
      let dialogRef = this.dialog.open(TaskFormComponent, { data: {task: {createdBy: this.loggedInUser()?.id, numberOfParticipants: 0}, title: "Aufgabe Hinzufügen", confirmationText: "Hinzufügen"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.store.dispatch(TaskActions.addTask({task: result}));
      });
    }

  viewTask(task: Task){
    this.dialog.open(TaskFormComponent, { data: {task: task, title: 'Aufgabe Ansicht', confirmationText: "Ok"}, minWidth: '700px'});
  }

  editTask(task: Task){
      let dialogRef = this.dialog.open(TaskFormComponent, { data: {task: task, title: 'Aufgabe Bearbeiten', confirmationText: "Bearbeiten"}, minWidth: '700px'});
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.store.dispatch(TaskActions.updateTask({task: result}));
      });
    }
  
    deleteTask(task: Task){
      let dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: `Aufgabe ${task.name} Löschen`});
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.store.dispatch(TaskActions.deleteTask({task: task}));
      });
    }

}
