import { ChatInputCommandInteraction, ModalBuilder } from "discord.js";
import { getErrorMessage, ErrorType } from "@clanscore/shared";
import { handleCreateLeaderboardCommand } from "../src/commands/gamification/createLeaderboard";

jest.mock("../src/config", () => ({
    config: {
        DISCORD_GUILD_ID: "fake_id",
    },
}));

describe("createleaderboard command", () => {
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

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should show a modal with correct customId", async () => {
        await handleCreateLeaderboardCommand(
            interaction as ChatInputCommandInteraction,
        );

        expect(interaction.showModal).toHaveBeenCalledWith(
            expect.any(ModalBuilder),
        );

        const modal = (interaction.showModal as jest.Mock).mock.calls[0][0];
        expect(modal).toBeInstanceOf(ModalBuilder);
        expect(modal.data.custom_id).toBe("create_leaderboard_modal");
    });

    it("should handle errors and call replyWithDeferredError", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("Modal failed");
        });

        await handleCreateLeaderboardCommand(
            interaction as ChatInputCommandInteraction,
        );

        expect(interaction.reply).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
        });
    });
});
