import { execute } from "../src/commands/other/help";
import { CommandInteraction, GuildMember, RoleManager } from "discord.js";

jest.mock("../src/config", () => ({
    config: {
        MANUAL_URL: "https://example.com/manual",
    },
}));

describe("help command", () => {
    let interaction: CommandInteraction;
    let rolesMock: RoleManager;

    beforeEach(() => {
        rolesMock = {
            cache: {
                some: jest.fn(),
            },
        } as unknown as RoleManager;

        interaction = {
            member: {
                roles: rolesMock,
            } as unknown as GuildMember,
            reply: jest.fn(),
        } as unknown as CommandInteraction;
    });

    it("should reply with basic help for regular members", async () => {
        (rolesMock.cache.some as jest.Mock).mockReturnValue(false); // Not Vorstand

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining(
                    "**Hilfe - Verfügbare Befehle:**",
                ),
            }),
        );

        expect(interaction.reply).not.toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining("**Vorstands-Befehle:**"),
            }),
        );
    });

    it("should include Vorstand commands for Vorstand members", async () => {
        (rolesMock.cache.some as jest.Mock).mockReturnValue(true); // Is Vorstand

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining("**Vorstands-Befehle:**"),
            }),
        );
    });
});
