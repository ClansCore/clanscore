import {
    ActionRowBuilder,
    ButtonInteraction,
    MessageActionRowComponentBuilder,
} from "discord.js";
import {
    ok,
    err,
    ErrorType,
    getErrorMessage 
} from "@clanscore/shared";
import { handleClaimTask } from "../src/commands/gamification/task/claimTask";
import { disableButtons } from "../src/utils-discord/guild";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/utils-discord/guild");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockDisableButtons = disableButtons as jest.Mock;

const mockReply = jest.fn();
const mockEditReply = jest.fn();
const mockEdit = jest.fn();

describe("claimtask command", () => {
    const interaction = {
        isButton: jest.fn().mockReturnValue(true),
        customId: "claim_task:task123",
        user: { id: "user123", tag: "TestUser#0001" },
        deferReply: jest.fn().mockImplementation(function () {
            (interaction as ButtonInteraction).deferred = true;
            return Promise.resolve();
        }),
        editReply: mockEditReply,
        reply: mockReply,
        message: {
            edit: mockEdit,
        },
    } as unknown as ButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockApi.getTaskById.mockResolvedValue(
            ok({
                id: "task123",
                name: "Test Task",
                completed: false,
                deadline: new Date(Date.now() + 10000), // not expired
                maxParticipants: 1,
                points: 10,
                createdBy: "user1",
            } as any),
        );

        mockApi.claimTask.mockResolvedValue(
            ok({
                maxReached: false,
            }),
        );

        mockDisableButtons.mockReturnValue(
            [] as ActionRowBuilder<MessageActionRowComponentBuilder>[],
        );
    });

    it("should claim task successfully", async () => {
        await handleClaimTask(interaction);

        expect(mockApi.claimTask).toHaveBeenCalledWith("task123", "user123");
        expect(mockEditReply).toHaveBeenCalled();
    });

    it("should reply if task is already completed", async () => {
        mockApi.claimTask.mockResolvedValue(err(ErrorType.TaskAlreadyCompleted));
        mockApi.getTaskParticipants.mockResolvedValue(ok([]));

        await handleClaimTask(interaction);

        expect(mockEditReply).toHaveBeenCalled();
    });

    it("should handle missing task", async () => {
        mockApi.getTaskById.mockResolvedValue(
            err(ErrorType.TaskNotFound, { taskId: "task123" }),
        );

        await handleClaimTask(interaction);

        expect(mockEditReply).toHaveBeenCalled();
    });

    it("should handle claim task error", async () => {
        mockApi.claimTask.mockResolvedValue(
            err(ErrorType.UserNotFound, { discordId: "user123" }),
        );

        await handleClaimTask(interaction);

        expect(mockEditReply).toHaveBeenCalled();
    });
});
