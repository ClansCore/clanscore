import {
    ChatInputCommandInteraction,
    ModalBuilder,
    MessageFlags,
} from "discord.js";
import { getErrorMessage, ErrorType } from "@clanscore/shared";
import { handleDonationCommand } from "../src/commands/gamification/donation";

jest.mock("../src/config", () => ({
    config: {
        DISCORD_GUILD_ID: "fake_id",
    },
}));

describe("donation command", () => {
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

    it("should show donation modal successfully", async () => {
        await handleDonationCommand(interaction as ChatInputCommandInteraction);

        expect(interaction.showModal).toHaveBeenCalled();
        const modal = (interaction.showModal as jest.Mock).mock.calls[0][0];
        expect(modal).toBeInstanceOf(ModalBuilder);
        expect(modal.data.custom_id).toBe("donation_modal");
    });

    it("should reply with error message if showModal fails and interaction is not yet replied/deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("Modal failed");
        });

        await handleDonationCommand(interaction as ChatInputCommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            flags: MessageFlags.Ephemeral,
        });
    });

    it("should follow up with error message if showModal fails and interaction is already replied/deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        interaction.deferred = true;
        (interaction.showModal as jest.Mock).mockImplementation(() => {
            throw new Error("Modal failed");
        });

        await handleDonationCommand(interaction as ChatInputCommandInteraction);

        expect(interaction.followUp).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            flags: MessageFlags.Ephemeral,
        });
    });
});
