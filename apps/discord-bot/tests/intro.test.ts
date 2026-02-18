import { handleIntro } from "../src/commands/other/intro";
import {
    getChannelByName,
    getCurrentChannel,
} from "../src/utils-discord/guild";
import { Collection, CommandInteraction, Role } from "discord.js";
import {
    ok,
    err,
    ErrorType,
} from "@clanscore/shared";

// Mock the guild utilities
jest.mock("../src/utils-discord/guild");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockedGetCurrentChannel = getCurrentChannel as jest.Mock;
const mockedGetChannelByName = getChannelByName as jest.Mock;

describe("/intro command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            guildId: "guild123",
            deferred: true,
            reply: jest.fn(),
            deferReply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            member: {
                roles: {
                    cache: new Collection<string, Role>(),
                },
            },
        } as unknown as CommandInteraction;
    });

    it("should send intro with help tip when in bot channel", async () => {
        mockedGetCurrentChannel.mockResolvedValueOnce(ok({ id: "channel123" }));
        mockedGetChannelByName.mockResolvedValueOnce(ok({ id: "channel123" }));

        await handleIntro(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining("/help"),
        });
    });

    it("should send intro with redirect when not in bot channel", async () => {
        mockedGetCurrentChannel.mockResolvedValueOnce(
            ok({ id: "wrongChannel" }),
        );
        mockedGetChannelByName.mockResolvedValueOnce(
            ok({ id: "rightChannel" }),
        );

        await handleIntro(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining("<#rightChannel>"),
        });
    });

    it("should return error if no guildId or roles", async () => {
        interaction.guildId = null;
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await handleIntro(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("should handle getCurrentChannel error", async () => {
        mockedGetCurrentChannel.mockResolvedValueOnce(
            err(ErrorType.ChannelNotFound),
        );
        await handleIntro(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should handle getChannelByName error", async () => {
        mockedGetCurrentChannel.mockResolvedValueOnce(ok({ id: "channel123" }));
        mockedGetChannelByName.mockResolvedValueOnce(
            err(ErrorType.ChannelNotFound),
        );
        await handleIntro(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
