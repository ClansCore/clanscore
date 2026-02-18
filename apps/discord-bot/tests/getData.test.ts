import { handleGetDataCommand } from "../src/commands/user/getdata";
import { CommandInteraction } from "discord.js";
import {
    ok,
    err,
    ErrorType,
    getErrorMessage 
} from "@clanscore/shared";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

const interaction = {
    user: { id: "123" },
    deferReply: jest.fn(),
    editReply: jest.fn(),
    deferred: true,
} as unknown as CommandInteraction;

const fakePersonData = {
    person: {
        id: "user123",
        firstName: "John",
        lastName: "Doe",
        nickname: "JD",
        birthdate: new Date("1990-01-01"),
        address: "123 Main St",
        email: "john@example.com",
        phone: "1234567890",
        score: 100,
        status: "Active",
        hasPaid: false,
    } as any,
    roles: [],
    tasks: [],
    donations: [],
    rewards: [],
    leaderboardEntries: [],
    transactions: [],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("/getdata command", () => {
    it("should successfully reply with user data", async () => {
        mockApi.getPersonDataByDiscordId.mockResolvedValue(
            ok(fakePersonData),
        );

        await handleGetDataCommand(interaction);

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith({
            embeds: expect.any(Array),
        });
    });

    it("should handle getPersonDataByDiscordId failure", async () => {
        mockApi.getPersonDataByDiscordId.mockResolvedValue(
            err(ErrorType.UserNotFound),
        );

        await handleGetDataCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
