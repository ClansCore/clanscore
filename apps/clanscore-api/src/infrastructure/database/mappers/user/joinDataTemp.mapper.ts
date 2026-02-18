import { JoinDataTempDTO } from "@clanscore/shared";
import { toId } from "../core";

export type JoinDataTempEntity = {
    _id: string;
    discordId: string;
    step1Data: {
        firstName: string;
        lastName: string;
        nickname: string;
        birthdate: string;
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toJoinDataTempEntity = (doc: any): JoinDataTempEntity => ({
    _id: toId(doc),
    discordId: doc.discordId,
    step1Data: {
        firstName: doc.step1Data?.firstName ?? "",
        lastName: doc.step1Data?.lastName ?? "",
        nickname: doc.step1Data?.nickname ?? "",
        birthdate: doc.step1Data?.birthdate ?? "",
    },
});

export const toJoinDataTempDTO = (p: JoinDataTempEntity): JoinDataTempDTO => ({
    id: p._id,
    discordId: p.discordId,
    step1Data: {
        firstName: p.step1Data.firstName,
        lastName: p.step1Data.lastName,
        nickname: p.step1Data.nickname,
        birthdate: p.step1Data.birthdate,
    }
});
