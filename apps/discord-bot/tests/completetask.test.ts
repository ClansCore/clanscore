import {
    CommandInteraction,
    User,
    StringSelectMenuOptionBuilder,
} from "discord.js";
import {
    err,
    ErrorType,
    ok,
    getErrorMessage
} from "@clanscore/shared";
import { handleCompleteTaskCommand } from "../src/commands/gamification/task/completetask";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("completetask command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            user: { id: "user123" } as User,
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
        } as unknown as CommandInteraction;
    });

    it("should return error if user lookup fails", async () => {
        mockApi.getOpenTasksForDiscordUser.mockResolvedValue(
            err(ErrorType.UserNotFound),
        );

        await handleCompleteTaskCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should return error if task participation lookup fails", async () => {
        mockApi.getOpenTasksForDiscordUser.mockResolvedValueOnce(
            err(ErrorType.TaskParticipantNotFound),
        );

        await handleCompleteTaskCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should return error if no incomplete tasks", async () => {
        mockApi.getOpenTasksForDiscordUser.mockResolvedValueOnce({
            ok: true,
            value: [],
        });

        await handleCompleteTaskCommand(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should display select menu for open tasks", async () => {
        mockApi.getOpenTasksForDiscordUser.mockResolvedValueOnce({
            ok: true,
            value: [
                {
                    id: "task123",
                    name: "Write docs",
                },
                {
                    id: "task456",
                    name: "Fix bugs",
                },
            ],
        });

        await handleCompleteTaskCommand(interaction);

        const replyCallArgs = (interaction.editReply as jest.Mock).mock
            .calls[0][0];
        const selectMenuOptions =
            replyCallArgs.components[0].components[0].options;

        const optionLabels = selectMenuOptions.map(
            (opt: StringSelectMenuOptionBuilder) => opt.data.label,
        );
        expect(optionLabels).toContain("Write docs");
        expect(optionLabels).toContain("Fix bugs");
    });
});
