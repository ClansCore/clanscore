import {
    CommandInteraction,
    Guild,
    GuildMember,
    Role,
    Collection,
} from "discord.js";
import { execute } from "../src/commands/user/syncusers";
import { getErrorMessage, ErrorType } from "@clanscore/shared";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

const makeRole = (name: string, id = name) =>
    ({
        id,
        name,
        position: 1,
    }) as Role;

const makeMember = (id: string, roles: Role[]) =>
    ({
        id,
        user: { id, username: `User_${id}`, tag: `User_${id}#1234` },
        roles: {
            cache: new Collection(roles.map((r) => [r.id, r])),
        },
    }) as GuildMember;

describe("/syncusers command", () => {
    let interaction: CommandInteraction;
    let guild: Guild;

    beforeEach(() => {
        const mitgliedRole = makeRole("Mitglied");
        const vorstandRole = makeRole("Vorstand");

        const members = [
            makeMember("123", [mitgliedRole]),
            makeMember("456", [vorstandRole]),
        ];

        guild = {
            id: "guild1",
            roles: {
                cache: new Collection([
                    ["Mitglied", mitgliedRole],
                    ["Vorstand", vorstandRole],
                ]),
            },
            channels: {
                cache: {
                    find: jest.fn().mockReturnValue(undefined),
                },
            },
            members: {
                fetch: jest
                    .fn()
                    .mockResolvedValue(
                        new Collection(members.map((m) => [m.id, m])),
                    ),
                me: {
                    roles: { highest: { position: 2 } },
                    permissions: { has: jest.fn().mockReturnValue(true) },
                } as unknown as GuildMember,
            },
        } as unknown as Guild;

        interaction = {
            guild,
            user: { id: "user1" },
            deferReply: jest.fn().mockImplementation(function () {
                interaction.deferred = true;
                return Promise.resolve();
            }),
            editReply: jest.fn(),
        } as unknown as CommandInteraction;

        jest.clearAllMocks();
    });

    it("should create new users and embed them in the reply", async () => {
        mockApi.syncUsers = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                changes: [
                    {
                        discordId: "123",
                        username: "User_123",
                        changeType: "created" as const,
                        details: "User created",
                    },
                ],
            },
        });

        await execute(interaction);

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining("✅ User-Synchronisierung mit Datenbank abgeschlossen."),
                embeds: expect.any(Array),
            }),
        );
    });

    it("should handle missing roles gracefully", async () => {
        // Remove one of the required roles from the guild
        guild.roles.cache.delete("Mitglied");

        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });

    it("should skip members without valid roles", async () => {
        mockApi.syncUsers = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                changes: [],
            },
        });

        // Mock guild channels for the log channel check
        (interaction.guild as any).channels = {
            cache: new Map(),
        };

        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalled();
    });
});
