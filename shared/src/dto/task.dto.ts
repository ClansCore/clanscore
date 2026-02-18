import { ISODate } from "./common.js";

export type TaskDTO = {
    id: string;
    name: string;
    description?: string | null;
    deadline?: ISODate | null;
    points: number;
    maxParticipants: number;
    participantCount?: number;
    responsible?: string; // personId
    completed?: boolean;
    createdBy: string;    // personId
    eventId?: string | null;
    taskTypeId?: string | null;
    createdAt?: ISODate;
    updatedAt?: ISODate | null;
};

export type TaskParticipantDTO = {
    id: string;
    registrationDate?: ISODate;
    completedByParticipant?: boolean;
    participantId: string; // personId
    taskId: string;
};

export type ClaimTaskResponseDTO = {
  // true, wenn durch den Claim die maximale Anzahl Teilnehmer erreicht wurde
  maxReached: boolean;
};

export type OpenTaskDTO = {
  id: string; // Task-ID (String, z.B. MongoDB ObjectId)
  name: string; // Anzeigename der Aufgabe
};

export type TaskCreateDTO = Omit<TaskDTO, "id"|"createdAt"|"updatedAt"|"completed"> & { completed?: boolean };

export type TaskUpdateDTO = Partial<TaskCreateDTO>;

export type TaskParticipantCreateDTO = Omit<TaskParticipantDTO, "id">;
