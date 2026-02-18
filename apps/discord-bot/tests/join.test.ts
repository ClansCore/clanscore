import { CommandInteraction, Guild } from "discord.js";
import { execute } from "../src/commands/user/join/join";
import { resetJoinRequest } from "../src/intergration/user-discord.service";
import * as guildUtils from "../src/utils-discord/guild";
import { err, ErrorType, getErrorMessage } from "@clanscore/shared";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/intergration/user-discord.service");
jest.mock("../src/utils-discord/guild");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("join command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            user: { id: "user123" },
            guildId: "guild123",
            guild: {
                channels: {
                    cache: new Map(),
                },
            } as unknown as Guild,
            reply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            showModal: jest.fn().mockResolvedValue(undefined),
            replied: false,
            deferred: false,
        } as unknown as CommandInteraction;

        const mockApi = api as jest.Mocked<typeof api>;
        mockApi.getJoinTempDataByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: [],
        });
    });

    it("replies if user is already active", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        (mockApi.getPersonByDiscordId as jest.Mock) = jest.fn().mockResolvedValue({
            ok: true,
            value: { status: "Active" },
        });

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.UserAlreadyExists }),
            ),
            flags: expect.any(Number),
        });
    });

    it("replies if buttons are still active on old application", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                status: "ToBeDeleted",
                applicationMessageId: "msg123",
            },
        });

        const mockChannel = {
            isTextBased: () => true,
            messages: {
                fetch: jest.fn().mockResolvedValue({
                    components: [
                        {
                            components: [
                                { type: 2, disabled: false }, // Active button
                            ],
                        },
                    ],
                }),
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (interaction.guild?.channels.cache as any).find = () => mockChannel;

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.UserApplicationPending }),
            ),
            flags: expect.any(Number),
        });
    });

    it("resubmits application if no active buttons", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        const person = {
            id: "abc123",
            status: "ToBeDeleted",
            applicationMessageId: "msg123",
        };

        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: person,
        });

        const mockChannel = {
            isTextBased: () => true,
            messages: {
                fetch: jest.fn().mockRejectedValue(new Error("not found")),
            },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (interaction.guild?.channels.cache as any).find = () => mockChannel;

        (guildUtils.getChannelByName as jest.Mock).mockResolvedValue({
            ok: true,
            value: { id: "chan123" },
        });

        const mockMsg = {
            id: "newmsg456",
            edit: jest.fn().mockResolvedValue(undefined),
        };
        (guildUtils.sendPersonInfoToChannel as jest.Mock).mockResolvedValue({
            ok: true,
            value: mockMsg,
        });

        await execute(interaction as CommandInteraction);

        expect(resetJoinRequest).toHaveBeenCalled();
        expect(mockMsg.edit).toHaveBeenCalled();
        expect(mockApi.updatePersonApplicationMessageId).toHaveBeenCalledWith(
            person.id,
            mockMsg.id,
        );
        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining("✅"),
            flags: expect.any(Number),
        });
    });

    it("handles missing guild or guildId gracefully", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: { status: "ToBeDeleted" },
        });

        interaction.guildId = null;

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.NotAServer }),
            ),
            flags: expect.any(Number),
        });
    });

    it("handles missing applications channel", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: { status: "ToBeDeleted" },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (interaction.guild?.channels.cache as any).find = () => null;

        (guildUtils.getChannelByName as jest.Mock).mockResolvedValue(
            err(ErrorType.ChannelNotFound),
        );

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.ChannelNotFound }),
            ),
            flags: expect.any(Number),
        });
    });

    it("handles message sending failure", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                status: "ToBeDeleted",
                applicationMessageId: "foo",
            },
        });

        const mockChannel = {
            isTextBased: () => true,
            messages: {
                fetch: jest
                    .fn()
                    .mockRejectedValue(new Error("message not found")),
            },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (interaction.guild?.channels.cache as any).find = () => mockChannel;

        (guildUtils.getChannelByName as jest.Mock).mockResolvedValue({
            ok: true,
            value: { id: "channelABC" },
        });

        (guildUtils.sendPersonInfoToChannel as jest.Mock).mockResolvedValue({
            ok: false,
        });

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.ReapplicationError }),
            ),
            flags: expect.any(Number),
        });
    });

    it("shows modal for new users", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: false,
        });

        await execute(interaction as CommandInteraction);

        expect(interaction.showModal).toHaveBeenCalled();
    });

    it("handles modal error with followUp if deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: false,
        });

        interaction.deferred = true;
        (interaction.showModal as jest.Mock).mockRejectedValue(
            new Error("fail"),
        );

        await execute(interaction as CommandInteraction);

        expect(interaction.followUp).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            ),
            flags: expect.any(Number),
        });
    });

    it("handles modal error with reply if not deferred", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockApi.getPersonByDiscordId = jest.fn().mockResolvedValue({
            ok: false,
        });

        interaction.deferred = false;
        (interaction.showModal as jest.Mock).mockRejectedValue(
            new Error("fail"),
        );

        await execute(interaction as CommandInteraction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining(
                getErrorMessage({ type: ErrorType.ModalOpeningFailure }),
            ),
            flags: expect.any(Number),
        });
    });
});
