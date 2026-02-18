import { handleEvents } from "../src/commands/events/events";
import { CommandInteraction } from "discord.js";
import { ErrorType, getErrorMessage, ok, err } from "@clanscore/shared";
import { api } from "../src/api/apiClient";
import { formatEvents } from "../src/intergration/event/event-format.service";

jest.mock("../src/api/apiClient");
jest.mock("../src/intergration/event/event-format.service");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockFormatEvents = formatEvents as jest.MockedFunction<typeof formatEvents>;

describe("/events command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            guildId: "guild123",
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
            deferred: true,
        } as unknown as CommandInteraction;
    });

    it("should reply with formatted events on success", async () => {
        mockApi.getUpcomingEvents.mockResolvedValue(
            ok([{ id: "event1" }] as any),
        );
        mockFormatEvents.mockReturnValue(
            ok({} as any),
        );

        await handleEvents(interaction);

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should handle missing guildId", async () => {
        interaction.guildId = null;

        await handleEvents(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: getErrorMessage({ type: ErrorType.NotAServer }),
        });
    });

    it("should handle getUpcomingEvents failure", async () => {
        mockApi.getUpcomingEvents.mockResolvedValue(
            err(ErrorType.CalendarNotFound),
        );

        await handleEvents(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should handle formatEvents failure", async () => {
        mockApi.getUpcomingEvents.mockResolvedValue(
            ok([{ id: "event1" }] as any),
        );
        mockFormatEvents.mockReturnValue(
            err(ErrorType.UnknownError),
        );

        await handleEvents(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
