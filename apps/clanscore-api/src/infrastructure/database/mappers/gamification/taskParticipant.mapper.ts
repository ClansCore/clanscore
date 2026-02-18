import { toId } from "../core";
import type { ITaskParticipant, ITaskPopulatedParticipant } from "../../../../domain/gamification/TaskParticipant";
import type { ITask } from "../../../../domain/gamification/Task";

export type TaskParticipantEntity = {
    _id: string;
    registrationDate?: Date;
    completedByParticipant?: boolean;
    participantId: string;
    taskId: string;
};

export const toTaskParticipantEntity = (doc: ITaskParticipant): TaskParticipantEntity => ({
    _id: toId(doc),
    registrationDate: doc.registrationDate,
    completedByParticipant: !!doc.completedByParticipant,
    participantId: toId(doc.participantId),
    taskId: toId(doc.taskId),
});

export type TaskParticipantWithTaskEntity = {
    _id: string;
    registrationDate?: Date;
    completedByParticipant?: boolean;
    participantId: string;
    task: Pick<ITask, "name" | "_id"> & { id: string };
};

export const toTaskParticipantWithTaskEntity = (doc: ITaskPopulatedParticipant | (ITaskParticipant & { taskId: ITask | null })): TaskParticipantWithTaskEntity | null => {
    if (!doc.taskId) {
        return null;
    }
    
    return {
        _id: toId(doc),
        registrationDate: doc.registrationDate,
        completedByParticipant: !!doc.completedByParticipant,
        participantId: toId(doc.participantId),
        task: {
            id: toId(doc.taskId),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            _id: (doc.taskId as any)._id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: (doc.taskId as any).name,
        },
    };
};
