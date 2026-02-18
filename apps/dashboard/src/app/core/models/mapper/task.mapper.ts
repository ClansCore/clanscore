import { TaskApiModel } from '../api/task-api.model';
import { UserApiModel } from '../api/user-api.model';
import { Task } from '../domain/task.model';
import { User } from '../domain/user.model';

export class TaskMapper {
  static fromApi(api: TaskApiModel): Task {
    return {
      id: api.id,
      taskTypeId: api.taskTypeId,
      name: api.name,
      description: api.description,
      points: api.points,
      deadline: new Date(api.deadline),
      completed: api.completed,
      maxParticipants: api.maxParticipants,
      numberOfParticipants: api.participantCount,
      createdBy: api.createdBy
    };
  }

  static toApi(task: Task): Partial<TaskApiModel> {
    return {
      id: task.id,
      taskTypeId: task.taskTypeId,
      name: task.name,
      description: task.description,
      points: task.points,
      deadline: task.deadline.toISOString(),
      completed: task.completed,
      maxParticipants: task.maxParticipants,
      participantCount: task.numberOfParticipants,
      createdBy: task.createdBy
    };
  }
}