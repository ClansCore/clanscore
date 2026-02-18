import {
    ChatInputCommandInteraction,
    ModalBuilder,
    MessageFlags,
} from "discord.js";
import { getErrorMessage, ErrorType } from "@clanscore/shared";
import { handleCreateTaskModal } from "../src/commands/gamification/task/createTaskModal";

jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

describe("createtask command", () => {
    let interaction: Partial<ChatInputCommandInteraction>;

    beforeEach(() => {
        interaction = {
            showModal: jest.fn(),
            reply: jest.fn(),
            followUp: jest.fn(),
            deferred: false,
            replied: false,
        } as unknown as Partial<ChatInputCommandInteraction>;
    });

    it("should show modal successfully", async () => {
        await handleCreateTaskModal(interaction as ChatInputCommandInteraction);

        expect(interaction.showModal).toHaveBeenCalledTimes(1);

        const modalArg = (interaction.showModal as jest.Mock).mock.calls[0][0];
        expect(modalArg).toBeInstanceOf(ModalBuilder);
    });

    it("should reply with error if showModal throws and interaction not replied/deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("fail");
        });

        await handleCreateTaskModal(interaction as ChatInputCommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            flags: MessageFlags.Ephemeral,
        });
    });

    it("should followUp with error if showModal throws and interaction already replied", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        interaction.replied = true;
        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("fail");
        });

        await handleCreateTaskModal(interaction as ChatInputCommandInteraction);

        expect(interaction.followUp).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            flags: MessageFlags.Ephemeral,
        });
    });

    it("should followUp with error if showModal throws and interaction already deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        interaction.deferred = true;
        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("fail");
        });

        await handleCreateTaskModal(interaction as ChatInputCommandInteraction);

        expect(interaction.followUp).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            flags: MessageFlags.Ephemeral,
        });
    });
});
