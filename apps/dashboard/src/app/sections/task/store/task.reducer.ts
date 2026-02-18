import { createReducer, on } from '@ngrx/store';
import * as TaskActions from './task.actions';
import { Task } from '../../../core/models/domain/task.model';
import { TaskType } from '../../../core/models/domain/taskType.model';

export interface TaskState {
  tasks: Task[];
  taskTypes: TaskType[];
  loading: boolean;
  error: string | null;
}

export const initialState: TaskState = {
  tasks: [],
  taskTypes: [],
  loading: false,
  error: null,
};

export const taskReducer = createReducer(
  initialState,
  on(TaskActions.getTasks, (state) => ({ ...state, loading: true })),
  on(TaskActions.getTasksSuccess, (state, { tasks }) => ({
    ...state,
    loading: false,
    tasks,
  })),
  on(TaskActions.getTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(TaskActions.addTaskSuccess, (state, { task }) => ({
      ...state,
      loading: false,
      tasks: [...state.tasks, {...task, numberOfParticipants: 0},],
    })),
    on(TaskActions.updateTaskSuccess, (state, { task }) => ({
      ...state,
      loading: false,
      tasks: state.tasks.map(t =>
        t.id === task.id ? task : t
      )
    })),
    on(TaskActions.deleteTaskSuccess, (state, { task }) => ({
      ...state,
      loading: false,
      tasks: state.tasks.filter(t => t.id !== task.id)
    })),
    on(TaskActions.getTaskTypesSuccess, (state, { taskTypes }) => ({
    ...state,
    loading: false,
    taskTypes,
  })),
);