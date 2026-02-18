import type { Binary } from "mongodb";
import type mongoose from "mongoose";
import type { IEventDetails } from "../../../../domain/event/EventDetails";
import { EventDetailsDTO } from "@clanscore/shared";

export type EventDetailsEntity = {
    id: string;
    _id: string;
    providerEventId: string;
    discordEventId: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    location?: string | null;
    discordHeaderImageBase64?: string | null;
    recurringEventId?: string | null;
    recurrenceRule?: string | null;
    discordMasterEventId?: string | null;
    updatedAt: Date;
};

type EventDetailsDocLike = Omit<IEventDetails, "discordHeaderImage"> & {
    discordHeaderImage?: Buffer | mongoose.Types.Buffer | Binary | null;
};

function toBase64(img?: Buffer | mongoose.Types.Buffer | Binary | null): string | null {
    if (!img) return null;
    if (Buffer.isBuffer(img)) return img.toString("base64");
    // mongodb.Binary hat .buffer (Uint8Array)
    const anyImg = img as unknown as { buffer?: ArrayBuffer | Uint8Array };
    if (anyImg?.buffer) {
        const nodeBuf = Buffer.isBuffer(anyImg.buffer)
        ? anyImg.buffer
        : Buffer.from(anyImg.buffer as ArrayBufferLike);
        return nodeBuf.toString("base64");
    }
    return null;
}

export function toEventDetailsEntity(doc: EventDetailsDocLike & { updatedAt?: Date; discordMasterEventId?: string | null }): EventDetailsEntity {
    return {
        id: String(doc._id),
        _id: String(doc._id),
        providerEventId: doc.providerEventId,
        discordEventId: doc.discordEventId,
        name: doc.name,
        description: doc.description ?? null,
        startDate: new Date(doc.startDate),
        endDate: new Date(doc.endDate),
        location: doc.location ?? null,
        discordHeaderImageBase64: toBase64(doc.discordHeaderImage),
        recurringEventId: doc.recurringEventId ?? null,
        recurrenceRule: doc.recurrenceRule ?? null,
        discordMasterEventId: doc.discordMasterEventId ?? null,
        updatedAt: doc.updatedAt ?? new Date(),
    };
}

export function toEventDetailsDTO(entity: EventDetailsEntity): EventDetailsDTO {
    return {
        id: entity._id,
        providerEventId: entity.providerEventId,
        discordEventId: entity.discordEventId,
        name: entity.name,
        description: entity.description ?? null,
        startDate: entity.startDate,
        endDate: entity.endDate,
        location: entity.location ?? null,
        recurringEventId: entity.recurringEventId ?? null,
        recurrenceRule: entity.recurrenceRule ?? null,
        discordMasterEventId: entity.discordMasterEventId ?? null,
        updatedAt: entity.updatedAt,
    };
}
