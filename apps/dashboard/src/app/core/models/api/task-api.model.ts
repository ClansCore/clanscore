export interface TaskApiModel {
  id: string;
  taskTypeId: string
  name: string;
  description: string;
  deadline: string;
  points: number;
  maxParticipants: number;
  participantCount: number;
  completed: boolean;
  createdBy: string;
}