export type GamificationParameterDTO = {
    id: string;
    pointsPerCHF: number;
    pointsPerDonation: number;
};
export type GamificationParameterCreateDTO = Omit<GamificationParameterDTO, "id">;
export type GamificationParameterUpdateDTO = Partial<GamificationParameterDTO>;
