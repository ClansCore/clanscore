import { ISODate } from "./common.js";

export type PersonStatus = "Pending" | "Accepted" | "ToBeDeleted";

export type PersonDTO = {
    id: string;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    discordId?: string | null;
    birthdate: string; // ISO-String, z. B. "2000-05-14"
    address: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    status: PersonStatus;
    hasPaid: boolean;
    score: number;
    applicationMessageId?: string | null;
    deletionDate?: string | null; // ISO-String oder null
    createdAt?: string;
    updatedAt?: string;
};

export type PersonCreateDTO = Omit<PersonDTO, "id"|"createdAt"|"updatedAt"|"score"|"hasPaid"|"status"> & {
    status?: PersonStatus;
    hasPaid?: boolean;
    score?: number;
};

export type PersonUpdateDTO = Partial<PersonCreateDTO>;

// Kompakte Darstellung einer Person (z. B. für Dropdowns im Bot)
export type PersonSummaryDTO = Pick<
    PersonDTO,
    "id" | "firstName" | "lastName" | "nickname"
>;

// Sync Users DTOs
export type DiscordMemberInput = {
    discordId: string;
    username: string;
    roleNames: string[];
};

export type SyncUsersRequestDTO = {
    discordMembers: DiscordMemberInput[];
};

export type UserStatusChange = {
    discordId: string;
    username: string;
    changeType: "created" | "reactivated" | "marked_for_deletion" | "roles_changed";
    details: string;
};

export type SyncUsersResponseDTO = {
    changes: UserStatusChange[];
};
