import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {TaskActions} from '.';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { TaskApiService } from '../../../core/services/task-api.service';

@Injectable()
export class TaskEffects {
  getTasks$;
  addTask$;
  updateTask$;
  deleteTask$;
  getTaskTypes$;
  addTasktype$;
  updateTasktype$;
  deleteTasktype$;

  constructor(private actions$: Actions, private taskService: TaskApiService) {
    this.getTasks$ = createEffect(() =>
      this.actions$.pipe(
        ofType(TaskActions.getTasks),
        mergeMap(() =>
          this.taskService.getAllTasks().pipe(
            map(tasks => TaskActions.getTasksSuccess({ tasks })),
            catchError(error => of(TaskActions.getTasksFailure({ error: error.message || 'Failed to load tasks' })))
          )
        )
      )
    );

    this.addTask$ = createEffect(() =>
            this.actions$.pipe(
              ofType(TaskActions.addTask),
              mergeMap((task) =>
                this.taskService.addTask(task.task).pipe(
                  map((task) => TaskActions.addTaskSuccess({task})),
                  catchError(error => of(TaskActions.addTaskFailure({ error: error.message || 'Failed to add task' })))
                )
              )
            )
        );
    
        this.updateTask$ = createEffect(() =>
            this.actions$.pipe(
              ofType(TaskActions.updateTask),
              mergeMap((task) =>
                this.taskService.updateTask(task.task).pipe(
                  map(task => TaskActions.updateTaskSuccess({task})),
                  catchError(error => of(TaskActions.updateTaskFailure({ error: error.message || 'Failed to update task' })))
                )
              )
            )
        );
    
        this.deleteTask$ = createEffect(() =>
            this.actions$.pipe(
              ofType(TaskActions.deleteTask),
              mergeMap((task) =>
                this.taskService.deleteTask(task.task).pipe(
                  map(task => TaskActions.deleteTaskSuccess({task})),
                  catchError(error => of(TaskActions.deleteTaskFailure({ error: error.message || 'Failed to delete task' })))
                )
              )
            )
        );

        this.getTaskTypes$ = createEffect(() =>
          this.actions$.pipe(
            ofType(TaskActions.getTaskTypes),
            mergeMap(() =>
              this.taskService.getAllTaskTypes().pipe(
                map(taskTypes => TaskActions.getTaskTypesSuccess({ taskTypes })),
                catchError(error => of(TaskActions.getTaskTypesFailure({ error: error.message || 'Failed to load taskTypes' })))
              )
            )
          )
        );

        this.addTasktype$ = createEffect(() =>
          this.actions$.pipe(
            ofType(TaskActions.addTasktype),
            mergeMap((tasktype) =>
              this.taskService.addTaskType(tasktype.tasktype).pipe(
                map((tasktype) => TaskActions.addTasktypeSuccess({tasktype})),
                catchError(error => of(TaskActions.addTasktypeFailure({ error: error.message || 'Failed to add tasktype' })))
              )
            )
          )
      );
  
      this.updateTasktype$ = createEffect(() =>
          this.actions$.pipe(
            ofType(TaskActions.updateTasktype),
            mergeMap((tasktype) =>
              this.taskService.updateTaskType(tasktype.tasktype).pipe(
                map(tasktype => TaskActions.updateTasktypeSuccess({tasktype})),
                catchError(error => of(TaskActions.updateTasktypeFailure({ error: error.message || 'Failed to update tasktype' })))
              )
            )
          )
      );
  
      this.deleteTasktype$ = createEffect(() =>
          this.actions$.pipe(
            ofType(TaskActions.deleteTasktype),
            mergeMap((tasktype) =>
              this.taskService.deleteTaskType(tasktype.tasktype).pipe(
                map(tasktype => TaskActions.deleteTasktypeSuccess({tasktype})),
                catchError(error => of(TaskActions.deleteTasktypeFailure({ error: error.message || 'Failed to delete tasktype' })))
              )
            )
          )
      );
    
  }
}

