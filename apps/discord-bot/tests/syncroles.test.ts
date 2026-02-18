import {
    CommandInteraction,
    Guild,
    Role,
    RoleManager,
    Collection,
} from "discord.js";
import { execute } from "../src/commands/user/syncroles";
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
        tags: {},
        hexColor: "#ffffff",
        position: 1,
        permissions: { bitfield: 123n },
        hoist: false,
        mentionable: false,
        iconURL: jest.fn(),
    }) as unknown as Role;

describe("/syncroles command", () => {
    let interaction: CommandInteraction;
    let guild: Guild;

    beforeEach(() => {
        const rolesCache = new Collection([
            ["Mitglied", makeRole("Mitglied")],
            ["Vorstand", makeRole("Vorstand")],
        ]);

        guild = {
            id: "guild1",
            features: [],
            roles: {
                cache: rolesCache,
                create: jest
                    .fn()
                    .mockResolvedValue(makeRole("DBonlyRole", "role1234")),
            } as unknown as RoleManager,
            members: {
                cache: new Collection(),
            },
            channels: {
                cache: new Collection(),
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
            channel: {
                awaitMessageComponent: jest.fn().mockImplementation(() =>
                    Promise.resolve({
                        customId: "confirm_overwrite",
                        update: jest.fn(),
                    }),
                ),
            },
        } as unknown as CommandInteraction;

        jest.clearAllMocks();
    });

    it("should show confirmation if there are conflicting roles, and continue on confirmation", async () => {
        mockApi.getAllRoles = jest.fn().mockResolvedValue({
            ok: true,
            value: [
                { id: "db1", name: "Mitglied" },
                { id: "db2", name: "Vorstand" },
            ],
        });
        mockApi.getUserRolesByRoleId = jest.fn().mockResolvedValue({
            ok: true,
            value: [
                { userId: { discordId: "12345" }, roleId: "role1" },
            ],
        });
        mockApi.syncRoles = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                createdInDb: [],
                updatedInDb: [],
                rolesToCreateInDiscord: [],
                userRoleAssignments: [],
            },
        });

        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining("überschrieben werden"),
                components: expect.any(Array),
            }),
        );

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining(
                    "Synchronisierung abgeschlossen",
                ),
            }),
        );
    });

    it("should proceed if no conflicting roles exist", async () => {
        mockApi.getAllRoles = jest.fn().mockResolvedValue({
            ok: true,
            value: [{ id: "db3", name: "SomethingElse" }],
        });
        mockApi.getUserRolesByRoleId = jest.fn().mockResolvedValue({
            ok: true,
            value: [
                { userId: { discordId: "12345" }, roleId: "role1" },
            ],
        });
        mockApi.syncRoles = jest.fn().mockResolvedValue({
            ok: true,
            value: {
                createdInDb: [],
                updatedInDb: [],
                rolesToCreateInDiscord: [],
                userRoleAssignments: [],
            },
        });

        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining(
                    "Synchronisierung abgeschlossen",
                ),
            }),
        );
    });
});
