import { CommandInteraction } from "discord.js";
import { 
    getErrorMessage,
    ok,
    err,
    ErrorType,
} from "@clanscore/shared";
import { handlePing } from "../src/commands/other/ping";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("ping command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            reply: jest.fn(),
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
        } as unknown as CommandInteraction;
    });

    it("replies with the first user name if user is found", async () => {
        mockApi.getFirstUser.mockResolvedValue(
            ok({
                id: "user1",
                firstName: "Jane",
                lastName: "Doe",
                birthdate: new Date(),
                status: "Active",
                hasPaid: false,
            } as any),
        );

        await handlePing(interaction);
        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("replies with fallback if no user is found", async () => {
        mockApi.getFirstUser.mockResolvedValue(err(ErrorType.UserNotFound));

        await handlePing(interaction);
        expect(interaction.editReply).toHaveBeenCalled();
    });
});
