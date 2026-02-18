import { PersonDTO, PersonStatus, PersonSummaryDTO } from "@clanscore/shared";
import type { IPerson } from "../../../../domain/user/Person";
import { toId } from "../core";

export type PersonEntity = {
    _id: string;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    discordId?: string | null;
    birthdate: Date;
    address: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    status?: "Pending" | "Accepted" | "ToBeDeleted";
    hasPaid: boolean;
    score: number;
    webPW?: string | null;
    applicationMessageId?: string | null;
    deletionDate?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
};

export const toPersonEntity = (doc: IPerson): PersonEntity => ({
    _id: toId(doc),
    firstName: doc.firstName,
    lastName: doc.lastName,
    nickname: doc.nickname ?? null,
    discordId: doc.discordId ?? null,
    birthdate: doc.birthdate,
    address: doc.address,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    notes: doc.notes ?? null,
    status: doc.status,
    hasPaid: !!doc.hasPaid,
    score: Number(doc.score ?? 0),
    webPW: doc.webPW ?? null,
    applicationMessageId: doc.applicationMessageId ?? null,
    deletionDate: doc.deletionDate ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

export const toPersonDTO = (p: PersonEntity): PersonDTO => ({
    id: String(p._id),
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname ?? null,
    discordId: p.discordId ?? null,
    birthdate: p.birthdate?.toISOString(),
    address: p.address,
    email: p.email ?? null,
    phone: p.phone ?? null,
    notes: p.notes ?? null,
    status: p.status as PersonStatus,
    hasPaid: !!p.hasPaid,
    score: Number(p.score ?? 0),
    applicationMessageId: p.applicationMessageId ?? null,
    deletionDate: p.deletionDate ? p.deletionDate.toISOString() : null,
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
});

export const fromPersonDTOtoPersonEntity = (dto: PersonDTO): PersonEntity => ({
    _id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    nickname: dto.nickname ?? null,
    discordId: dto.discordId ?? null,
    birthdate:new Date(dto.birthdate),
    address: dto.address,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    notes: dto.notes ?? null,
    status: dto.status,
    hasPaid: !!dto.hasPaid,
    score: Number(dto.score ?? 0),
    applicationMessageId: dto.applicationMessageId ?? null,
    deletionDate: dto.deletionDate ? new Date(dto.deletionDate) : null,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
});

export const toPersonSummaryDTO = (p: PersonEntity): PersonSummaryDTO => ({
    id: String(p._id),
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname ?? null,
});
