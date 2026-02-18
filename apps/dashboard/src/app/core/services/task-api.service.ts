import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { Task } from "../models/domain/task.model";
import { TaskApiModel } from "../models/api/task-api.model";
import { TaskMapper } from "../models/mapper/task.mapper";
import { TaskType } from "../models/domain/taskType.model";
import { TaskTypeApiModel } from "../models/api/taskType-api.model";
import { TaskTypeMapper } from "../models/mapper/taskType.mapper";

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tasks`;

  getAllTasks(): Observable<Task[]> {
    return this.http.get<TaskApiModel[]>(this.baseUrl).pipe(
      map(tasks => tasks.map(TaskMapper.fromApi))
    );
  }

  addTask(taskInput: Task): Observable<Task> {
      return this.http.post< TaskApiModel>(this.baseUrl, {task: taskInput}).pipe(
        map(task => {
          const patchedValue: TaskApiModel = {
          ...task
        };
          return  TaskMapper.fromApi(patchedValue);
        })
      );
    }
  
    updateTask(updateTask: Task): Observable<Task> {
      const task = TaskMapper.toApi(updateTask);
      return this.http.patch<TaskApiModel>(this.baseUrl+ `/${task.id}`, {task: {...task, _id: task.id}}).pipe(
        map(task => updateTask)
      );
    }
  
    deleteTask(deleteTask: Task): Observable<Task> {
      const task = TaskMapper.toApi(deleteTask);
      return this.http.delete<TaskApiModel>(`${this.baseUrl}/${task.id}`).pipe(
        map((task) => deleteTask)
      );
    }

    getAllTaskTypes(): Observable<TaskType[]>{
      return this.http.get<TaskTypeApiModel[]>(this.baseUrl + "/tasktypes").pipe(
      map(tasksTypes => tasksTypes.map(TaskTypeMapper.fromApi))
    );
    }

    addTaskType(taskInput: TaskType): Observable<TaskType> {
      return this.http.post< TaskTypeApiModel>(this.baseUrl + "/tasktypes", {taskType: taskInput}).pipe(
        map(taskType => {
          const patchedValue: TaskTypeApiModel = {
          ...taskType
        };
          return  TaskTypeMapper.fromApi(patchedValue);
        })
      );
    }
  
    updateTaskType(updateTaskType: TaskType): Observable<TaskType> {
      const taskType = TaskTypeMapper.toApi(updateTaskType);
      return this.http.patch<TaskTypeApiModel>(this.baseUrl+ `/tasktypes/${taskType.id}`, {taskType: {...taskType, _id: taskType.id}}).pipe(
        map(taskType => updateTaskType)
      );
    }
  
    deleteTaskType(deleteTaskType: TaskType): Observable<TaskType> {
      const taskType = TaskTypeMapper.toApi(deleteTaskType);
      return this.http.delete<TaskTypeApiModel>(`${this.baseUrl}/tasktypes/${taskType.id}`).pipe(
        map((taskType) => deleteTaskType)
      );
    }
}