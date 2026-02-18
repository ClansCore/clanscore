export interface Task {
  id: string;
  taskTypeId?: string;
  name: string;
  description: string;
  deadline: Date;
  points: number;
  maxParticipants: number
  numberOfParticipants: number;
  completed: boolean;
  createdBy: string;
}