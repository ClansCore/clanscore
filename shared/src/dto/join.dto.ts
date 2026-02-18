export type JoinTempStep1DTO = {
    firstName: string;
    lastName: string;
    nickname?: string;
    birthdate: string; // "dd.MM.yyyy"
};

// Bot -> API
export type JoinDataTempInputDTO = {
    discordId: string;
    step1Data: JoinTempStep1DTO;
};

// API -> Bot
export type JoinDataTempDTO = {
    id: string;
    discordId: string;
    step1Data: JoinTempStep1DTO;
};
