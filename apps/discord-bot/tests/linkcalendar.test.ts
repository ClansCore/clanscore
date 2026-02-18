import { CommandInteraction } from "discord.js";
import { execute } from "../src/commands/events/calendar/linkcalendar";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("googleapis", () => ({
    google: {
        auth: {
            OAuth2: jest.fn(() => ({
                generateAuthUrl: jest.fn().mockReturnValue("fake_auth_url"),
            })),
        },
    },
}));

jest.mock("../src/config", () => ({
    config: {
        GOOGLE_CALENDAR_CLIENT_ID: "fake_client_id",
        GOOGLE_CALENDAR_CLIENT_CLIENT_SECRET: "fake_client_secret",
        GOOGLE_CALENDAR_REDIRECT_URI: "fake_redirect_uri",
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("execute", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            guildId: "12345",
            reply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn().mockResolvedValue(undefined),
        } as unknown as CommandInteraction;
    });

    it("should reply with an authentication URL if guildId exists", async () => {
        mockApi.generateCalendarLinkUrl = jest.fn().mockResolvedValue({
            ok: true,
            value: "https://example.com/auth",
        });

        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
