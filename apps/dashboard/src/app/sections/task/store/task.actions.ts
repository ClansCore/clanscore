import { createAction, props } from '@ngrx/store';
import { Task } from '../../../core/models/domain/task.model';
import { TaskType } from '../../../core/models/domain/taskType.model';
import { Role } from '../../../core/models/domain/role.model';

export const getTasks = createAction('[Task] GetTasks');
export const getTasksSuccess = createAction('[Task] GetTasks Success', props<{ tasks: Task[] }>());
export const getTasksFailure = createAction('[Task] GetTasks Failure', props<{ error: string }>());

export const addTask = createAction('[Task] AddTask', props<{ task: Task }>());
export const addTaskSuccess = createAction('[Task] AddTask Success', props<{ task: Task }>());
export const addTaskFailure = createAction('[Task] AddTask Failure', props<{ error: string }>());

export const updateTask = createAction('[Task] UpdateTask', props<{ task: Task }>());
export const updateTaskSuccess = createAction('[Task] UpdateTask Success', props<{ task: Task }>());
export const updateTaskFailure = createAction('[Task] UpdateTask Failure', props<{ error: string }>());

export const deleteTask = createAction('[Task] DeleteTask', props<{ task: Task }>());
export const deleteTaskSuccess = createAction('[Task] DeleteTask Success', props<{ task: Task }>());
export const deleteTaskFailure = createAction('[Task] DeleteTask Failure', props<{ error: string }>());

export const getTaskTypes = createAction('[Task] GetTaskTypes');
export const getTaskTypesSuccess = createAction('[Task] GetTaskTypes Success', props<{ taskTypes: TaskType[] }>());
export const getTaskTypesFailure = createAction('[Task] GetTaskTypes Failure', props<{ error: string }>());

export const addTasktype = createAction('[Task] AddTasktype', props<{ tasktype: TaskType }>());
export const addTasktypeSuccess = createAction('[Task] AddTasktype Success', props<{ tasktype: TaskType }>());
export const addTasktypeFailure = createAction('[Task] AddTasktype Failure', props<{ error: string }>());

export const updateTasktype = createAction('[Task] UpdateTasktype', props<{ tasktype: TaskType }>());
export const updateTasktypeSuccess = createAction('[Task] UpdateTasktype Success', props<{ tasktype: TaskType }>());
export const updateTasktypeFailure = createAction('[Task] UpdateTasktype Failure', props<{ error: string }>());

export const deleteTasktype = createAction('[Task] DeleteTasktype', props<{ tasktype: TaskType }>());
export const deleteTasktypeSuccess = createAction('[Task] DeleteTasktype Success', props<{ tasktype: TaskType }>());
export const deleteTasktypeFailure = createAction('[Task] DeleteTasktype Failure', props<{ error: string }>());