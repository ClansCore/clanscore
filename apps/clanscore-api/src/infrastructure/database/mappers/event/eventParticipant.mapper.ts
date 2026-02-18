import type { IEventParticipant } from "../../../../domain/event/EventParticipant";
import type { IPerson } from "../../../../domain/user/Person";

export type EventParticipantEntity = {
    _id: string;
    registrationDate: string; // ISO
    personId: string;
    eventId: string;
};

export type EventParticipantWithPersonEntity = {
    _id: string;
    registrationDate: string; // ISO
    eventId: string;
    person: {
        id: string;
        nickname: string | null;
    };
};

export function toEventParticipantEntity(doc: IEventParticipant): EventParticipantEntity {
    return {
        _id: String(doc._id),
        registrationDate: new Date(doc.registrationDate).toISOString(),
        personId: String(doc.personId),
        eventId: String(doc.eventId),
    };
}

// für .populate('personId', 'nickname')-Ergebnisse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toEventParticipantWithPersonEntity(populated: any): EventParticipantWithPersonEntity {
    const p = populated.personId as IPerson;
    return {
        _id: String(populated._id),
        registrationDate: new Date(populated.registrationDate).toISOString(),
        eventId: String(populated.eventId),
        person: {
        id: String(p._id),
        nickname: p.nickname ?? null,
        },
    };
}
