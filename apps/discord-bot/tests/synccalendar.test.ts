import { handleSyncCalendar } from "../src/commands/events/calendar/synccalendar";
import { CommandInteraction, Guild } from "discord.js";
import { ok, err, ErrorType, getErrorMessage } from "@clanscore/shared";
import * as discordHandler from "../src/discord.handler";

jest.mock("../src/discord.handler");

jest.mock("../src/config", () => ({
    config: {
        DISCORD_GUILD_ID: "fake_id",
    },
}));

jest.mock("rrule", () => ({
    __esModule: true,
    default: {
        RRule: {},
        Frequency: {},
    },
}));

describe("/synccalendar command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            guild: {
                id: "guild123",
                channels: {
                    cache: {
                        find: jest.fn().mockReturnValue(undefined),
                    },
                },
            } as unknown as Guild,
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
            deferred: true,
        } as unknown as CommandInteraction;
    });

    it("should reply with success message when sync succeeds", async () => {
        (discordHandler.performFullCalendarSync as jest.Mock).mockResolvedValue({
            synced: 5,
            created: 2,
            deleted: 1,
        });

        await handleSyncCalendar(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should handle missing guild", async () => {
        const interactionNoGuild = {
            ...interaction,
            guild: null,
        } as unknown as CommandInteraction;

        await handleSyncCalendar(interactionNoGuild);

        expect(interactionNoGuild.editReply).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.NotAServer }),
        });
    });

    it("should handle error from performFullCalendarSync", async () => {
        (discordHandler.performFullCalendarSync as jest.Mock).mockResolvedValue(null);

        await handleSyncCalendar(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
