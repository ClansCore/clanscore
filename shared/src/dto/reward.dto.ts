export type RewardDTO = { 
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    clubCostShare: number;
};

// export type RewardTransactionDTO = {
//     id: string;
//     rewardId: string;
//     personDiscordId: string;
// };

export type RewardCreateDTO = Omit<RewardDTO, "id">;

export type RewardUpdateDTO = Partial<RewardCreateDTO>;
