import { CommandInteraction, Guild, Collection } from "discord.js";
import { execute } from "../src/commands/user/leave";
import {
    err,
    ErrorType,
    ok,
    getErrorMessage 
} from "@clanscore/shared";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/utils-discord/sendDm");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("leave command", () => {
    let interaction: CommandInteraction;
    const mockPerson = {
        id: "abc123",
        firstName: "Test",
        lastName: "User",
        birthdate: "1990-01-01",
        address: "123 Test St",
        status: "Accepted" as const,
        hasPaid: false,
        score: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            user: { id: "user123", tag: "TestUser#0001" },
            client: {},
            guildId: "guild123",
            guild: {
                members: {
                    fetch: jest.fn().mockResolvedValue({
                        roles: {
                            cache: new Collection<
                                string,
                                { id: string; name: string }
                            >([
                                ["123", { id: "123", name: "Mitglied" }],
                                ["456", { id: "456", name: "Vorstand" }],
                            ]),
                            remove: jest.fn(),
                        },
                    }),
                },
                roles: {
                    cache: new Map([
                        ["roleId", { id: "roleId", name: "Mitglied" }],
                    ]),
                },
                channels: {
                    cache: new Map([
                        [
                            "chanId",
                            {
                                name: "bewerbungen",
                                isTextBased: () => true,
                                send: jest.fn(),
                            },
                        ],
                    ]),
                },
            } as unknown as Guild,
            channel: {
                awaitMessageComponent: jest.fn(),
            },
            deferReply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            deferred: true,
        } as unknown as CommandInteraction;
    });

    it("handles missing user record", async () => {
        mockApi.getPersonByDiscordId.mockResolvedValue(
            err(ErrorType.NotFound),
        );

        await execute(interaction as CommandInteraction);

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("handles already marked for deletion", async () => {
        mockApi.getPersonByDiscordId.mockResolvedValue(
            ok({ ...mockPerson, status: "ToBeDeleted" }),
        );

        await execute(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("cancels on no confirmation (timeout)", async () => {
        mockApi.getPersonByDiscordId.mockResolvedValue(
            ok(mockPerson),
        );

        interaction.channel!.awaitMessageComponent = jest
            .fn()
            .mockRejectedValue(null);

        await execute(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("cancels on explicit cancel", async () => {
        mockApi.getPersonByDiscordId.mockResolvedValue(
            ok(mockPerson),
        );

        interaction.channel!.awaitMessageComponent = jest
            .fn()
            .mockResolvedValue({
                customId: "cancel_leave",
            });

        await execute(interaction as CommandInteraction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
