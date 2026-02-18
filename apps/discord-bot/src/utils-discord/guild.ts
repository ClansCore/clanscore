import {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonComponent,
    ButtonStyle,
    Client,
    CommandInteraction,
    ComponentType,
    EmbedBuilder,
    GuildScheduledEvent,
    Message,
    MessageActionRowComponent,
    MessageActionRowComponentBuilder,
    NonThreadGuildBasedChannel,
    TextBasedChannel,
    TextChannel,
} from "discord.js";
import {
    ErrorType,
    ErrorDetails,
    ok,
    Result,
    err,
    PersonDTO,
    TaskDTO,
    TaskParticipantDTO,
    RewardDTO,
    TransactionDTO,
    ChannelNames,
} from "@clanscore/shared";
import { api } from "../api/apiClient";

let client: Client;

export function setClientInstance(instance: Client) {
    client = instance;
}

export async function getChannelByName(
    guildId: string,
    channelName: string,
): Promise<Result<NonThreadGuildBasedChannel, ErrorDetails>> {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
        return err(ErrorType.NotAServer);
    }

    const channels = await guild.channels.fetch();

    const targetChannel = channels.find(
        (channel) => channel?.isTextBased() && channel.name === channelName,
    );

    if (!targetChannel) {
        return err(ErrorType.ChannelNotFound, { channel: channelName });
    }

    return ok(targetChannel);
}

export async function getCurrentChannel(
    interaction: CommandInteraction,
): Promise<Result<TextBasedChannel, ErrorDetails>> {
    const currentChannel = interaction.channel;

    if (!currentChannel) {
        return err(ErrorType.ChannelNotFound);
    }

    return ok(currentChannel);
}

export async function sendMessageToChannel(
    channelId: string,
    message: string,
): Promise<Result<boolean, ErrorDetails>> {
    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            return err(ErrorType.ChannelNotFound);
        }

        await (channel as TextChannel).send(message);
        return ok(true);
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }
}

export async function sendPersonInfoToChannel(
    channelId: string,
    person: PersonDTO,
) {
    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            return err(ErrorType.ChannelNotFound);
        }

        const rolesResult = await api.getUserRolesByUserId(person.id);
        let rolesDisplay = "-";
        if (rolesResult.ok) {
            const roles = rolesResult.value.map(
                (r) => (r.id as unknown as { name: string }).name,
            );
            rolesDisplay = roles.join(", ");
        }

        const embed = new EmbedBuilder()
            .setTitle(`📢 Bewerbung von Nutzer: ${person.nickname}`)
            .setColor(0x3498db)
            .addFields(
                { name: "ID", value: `**${person.id}**`, inline: false },
                {
                    name: "Rollen",
                    value: rolesDisplay,
                    inline: false,
                },
                { name: "Vorname", value: person.firstName, inline: false },
                { name: "Nachname", value: person.lastName, inline: false },
                {
                    name: "Nickname",
                    value: person.nickname || "-",
                    inline: false,
                },
                {
                    name: "Discord ID",
                    value: `${person.discordId}`,
                    inline: false,
                },
                {
                    name: "Geburtstag",
                    value: String(person.birthdate),
                    inline: false,
                },
                { name: "Adresse", value: person.address, inline: false },
                { name: "Email", value: person.email || "-", inline: false },
                {
                    name: "Telefonnummer",
                    value: person.phone || "-",
                    inline: false,
                },
            )
            .setTimestamp();

        const message = await (channel as TextChannel).send({
            embeds: [embed],
        });
        return ok(message);
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }
}

export async function sendTaskCompletedInfoToChannel(
    channelId: string,
    task: TaskDTO,
    person: PersonDTO,
    taskParticipant: TaskParticipantDTO,
    responsiblePerson: string,
) {
    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            return err(ErrorType.ChannelNotFound);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Aufgabe fertiggestellt von Nutzer: ${person.nickname}`)
            .setColor(0x3498db)
            .addFields(
                { name: "ID", value: `${task.id}`, inline: false },
                {
                    name: "Aufgabenname",
                    value: `**${task.name}**`,
                    inline: false,
                },
                {
                    name: "Beschreibung",
                    value: `**${task.description ?? "Keine Beschreibung"}**`,
                    inline: false,
                },
            )
            .setTimestamp();

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`accept_task_completion:${taskParticipant.id}`)
                .setLabel("Akzeptieren")
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId(`deny_task_completion:${taskParticipant.id}`)
                .setLabel("Ablehnen")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false),
        );

        const message = await (channel as TextChannel).send({
            content: responsiblePerson.length != 0
                ? `${responsiblePerson} eine deiner Aufgaben wurde abgeschlossen.`
                : "",
            embeds: [embed],
            components: [buttonRow],
        });
        return ok(message);
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }
}

export async function sendRewardInfoToChannel(
    channelId: string,
    reward: RewardDTO,
    transaction: TransactionDTO,
    userDiscordId: string,
) {
    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            return err(ErrorType.ChannelNotFound);
        }

        const personResult = await api.getPersonByDiscordId(userDiscordId);
        if (!personResult.ok) {
            return personResult;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Belohnung für Nutzer: ${personResult.value.nickname}`)
            .setColor(0xff9800)
            .addFields(
                {
                    name: "Transaktions ID",
                    value: `${transaction.id}`,
                    inline: false,
                },
                {
                    name: "Belohnung",
                    value: `**${reward.name}**`,
                    inline: false,
                },
                {
                    name: "Vorname",
                    value: `${personResult.value.firstName}`,
                    inline: false,
                },
                {
                    name: "Nachname",
                    value: `${personResult.value.lastName}`,
                    inline: false,
                },
                {
                    name: "Adresse",
                    value: `${personResult.value.address}`,
                    inline: false,
                },
            )
            .setTimestamp();

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`accept_reward:${transaction.id}`)
                .setLabel("Akzeptieren")
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),
            new ButtonBuilder()
                .setCustomId(`deny_reward:${transaction.id}`)
                .setLabel("Ablehnen")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false),
        );

        await (channel as TextChannel).send({
            embeds: [embed],
            components: [buttonRow],
        });

        return ok(undefined);
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }
}

export async function notifyEvent(
    guildId: string, 
    event: GuildScheduledEvent,
    existingMessageId?: string
): Promise<Result<Message, ErrorDetails>> {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return err(ErrorType.NotAServer);

    const targetChannel = await getChannelByName(guildId, ChannelNames.EVENTS);
    if (!targetChannel.ok) return err(ErrorType.ChannelNotFound);

    const channel = targetChannel.value as TextChannel;

    const subscribers = await event.fetchSubscribers({ limit: 100 });
    const mentions = subscribers.map((user) => `<@${user.user.id}>`).join(", ") || "";

    const startTime = event.scheduledStartTimestamp!;
    const endTime = event.scheduledEndAt?.getTime() || startTime;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    const dateFormatter = new Intl.DateTimeFormat("de-CH", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const timeFormatter = new Intl.DateTimeFormat("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const startDateStr = dateFormatter.format(startDate);
    const startTimeStr = timeFormatter.format(startDate);
    const endTimeStr = timeFormatter.format(endDate);
    const relativeTime = `<t:${Math.floor(startTime / 1000)}:R>`;

    const timeRange = startTimeStr === endTimeStr 
        ? `${startTimeStr} Uhr`
        : `${startTimeStr} - ${endTimeStr} Uhr`;

    const embed = new EmbedBuilder()
        .setTitle(`Nächstes Event:\n${event.name}`)
        .setColor(0x3e6dfa)
        .setTimestamp();

    if (event.description) {
        embed.setDescription(event.description);
        embed.addFields(
            {
                name: "",
                value: "",
                inline: true,
            }
        );
    }

    embed.addFields(
        {
            name: "📅 Datum / Zeit",
            value: `${startDateStr}\n${timeRange}\n${relativeTime}`,
            inline: false,
        }
    );
    embed.addFields(
        {
            name: "",
            value: "",
            inline: true,
        }
    );

    if (event.entityMetadata?.location) {
        embed.addFields({
            name: "📍 Ort",
            value: event.entityMetadata.location,
            inline: false,
        });
        embed.addFields(
            {
                name: "",
                value: "",
                inline: true,
            }
        );
    }

    if (mentions && mentions.length > 0) {
        embed.addFields({
            name: `👥 Interessiert (${subscribers.size})`,
            value: mentions.length > 1024 ? mentions.substring(0, 1020) + "..." : mentions,
            inline: false,
        });
    }

    try {
        if (existingMessageId) {
            try {
                const existingMessage = await channel.messages.fetch(existingMessageId);
                const existingEmbed = existingMessage.embeds[0];
                const newEmbedData = embed.toJSON();
                
                const hasChanged = 
                    !existingEmbed ||
                    existingEmbed.title !== newEmbedData.title ||
                    existingEmbed.description !== newEmbedData.description ||
                    JSON.stringify(existingEmbed.fields) !== JSON.stringify(newEmbedData.fields);
                
                if (!hasChanged) {
                    return ok(existingMessage);
                }
                
                const updatedMessage = await existingMessage.edit({ 
                    embeds: [embed] 
                });
                return ok(updatedMessage);
            } catch (error) {
                const message = await channel.send({ 
                    embeds: [embed] 
                });
                return ok(message);
            }
        } else {
            const message = await channel.send({ 
                embeds: [embed] 
            });
            return ok(message);
        }
    } catch (error) {
        return err(ErrorType.MessageNotSend);
    }
}

export function disableButtons(
    message: Message,
    buttonCustomIdStartsWith: string[],
    labelOverrides?: Record<string, string>,
) {
    const rows = message.components as ActionRow<MessageActionRowComponent>[];
    return rows.map((row) => {
        const newComponents = row.components.map((component) => {
        if (component.type === ComponentType.Button) {
            const btn = component as ButtonComponent;

            if (buttonCustomIdStartsWith.some((prefix) => btn.customId?.startsWith(prefix))) {
                const builder = ButtonBuilder.from(btn).setDisabled(true);

                const matchedPrefix = buttonCustomIdStartsWith.find((prefix) =>
                    btn.customId?.startsWith(prefix),
                );
                if (matchedPrefix && labelOverrides?.[matchedPrefix]) {
                    builder.setLabel(labelOverrides[matchedPrefix]);
                }
                return builder;
            }
        }
        return component as unknown as MessageActionRowComponentBuilder;
    });
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        newComponents,
        );
    });
}
