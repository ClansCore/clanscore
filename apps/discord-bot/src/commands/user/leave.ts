import {
    CommandInteraction,
    SlashCommandBuilder,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    TextChannel,
} from "discord.js";
import { getErrorMessage, ErrorType, ChannelNames } from "@clanscore/shared";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { sendDm } from "../../utils-discord/sendDm";
import { UserApplicationDiscordService } from "../../intergration/user-discord.service";
import { api } from "../../api/apiClient";

export const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription(
        "Tritt aus dem Verein aus. Deine Daten werden nach 3 Monaten gelöscht.",
    );

export async function handleLeaveCommand(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userDiscordId = interaction.user.id;
    const personResult = await api.getPersonByDiscordId(userDiscordId);
    if (!personResult.ok) {
        await replyWithDeferredError(interaction, personResult.error);
        return;
    }

    const person = personResult.value;

    if (person.status === "ToBeDeleted") {
        await interaction.editReply({
            content: getErrorMessage({ type: ErrorType.UserDeletionPending }),
        });
        return;
    }

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("confirm_leave")
            .setLabel("Ja, ich will austreten")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("cancel_leave")
            .setLabel("Abbrechen")
            .setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({
        content: `
⚠️ **Bist du dir sicher, dass du den Verein verlassen willst?**

Mit dem Austritt verlierst du sofort alle zugewiesenen Rollen.
Deine personenbezogenen Daten werden nach 3 Monaten endgültig gelöscht.`,
        components: [confirmRow],
    });

    const confirmation = await interaction.channel
        ?.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 20_000,
            filter: (btnInt) => btnInt.user.id === interaction.user.id,
        })
        .catch(() => null);

    if (!confirmation || confirmation.customId === "cancel_leave") {
        await interaction.editReply({
            content: getErrorMessage({ type: ErrorType.UserLeaveCancelled }),
            components: [],
        });
        return;
    }

    const deletionService = new UserApplicationDiscordService();
    const deletionResult = await deletionService.markUserForDeletion(
        person,
        interaction.guild!,
    );
    if (!deletionResult.ok) {
        await replyWithDeferredError(interaction, deletionResult.error);
        return;
    }

    const deletionDate = deletionResult.value.deletionDate
        ? new Date(deletionResult.value.deletionDate)
        : null;

    const formattedDate =
        deletionDate?.toLocaleDateString("de-CH") ?? "unbekannt";

    await confirmation.update({
        content: `
✅ Dein Austritt wurde registriert. Deine Rollen wurden entfernt.
🗓️ Deine Daten werden am **${formattedDate}** gelöscht.`,
        components: [],
    });

    await sendDm(userDiscordId, interaction.client, {
        content: 
`📬 Du hast den Verein erfolgreich verlassen. 
Deine personenbezogenen Daten werden am **${formattedDate}** gelöscht. 

Du kannst im Bot-Channel mit dem Befehl \`/join\` erneut eine Beitrittsanfrage stellen. 
Wenn du Fragen hast, melde dich gerne beim Vorstand.`,
    });

    const channel = interaction.guild?.channels.cache.find(
        (c) => c.name === ChannelNames.APPLICATIONS && c.isTextBased(),
    ) as TextChannel | undefined;
    if (channel) {
        await channel.send(
`📢 **${interaction.user.tag}** hat den Verein verlassen. 
Löschdatum: **${formattedDate}**.`,
        );
    }
}

export const execute = withRoleAccess(handleLeaveCommand, [
    "Vorstand",
    "Mitglied",
]);
