import { CommandInteraction, User } from "discord.js";
import { 
    getErrorMessage,
    ok,
    err,
    ErrorType,
} from "@clanscore/shared";
import { handleScoreCommand } from "../src/commands/gamification/score";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("score command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            user: { id: "123" } as User,
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
            reply: jest.fn(),
        } as unknown as CommandInteraction;
    });

    it("should display the user's score when found", async () => {
        mockApi.getPersonDataByDiscordId.mockResolvedValueOnce({
            ok: true,
            value: {
                person: {
                    id: "user123",
                    firstName: "Test",
                    lastName: "User",
                    score: 42,
                    birthdate: new Date(),
                } as any,
                roles: [],
                tasks: [],
                donations: [],
                rewards: [],
                leaderboardEntries: [],
                transactions: [],
            },
        });

        await handleScoreCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should handle errors and call replyWithDeferredError", async () => {
        mockApi.getPersonDataByDiscordId.mockResolvedValueOnce(
            err(ErrorType.UserNotFound),
        );

        await handleScoreCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
