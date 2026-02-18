import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    ComponentType,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import {
    ChannelNames,
    ErrorType,
    getErrorMessage,
    err,
    type ErrorDetails,
    type Result,
    RewardDTO,
    ok,
    TransactionDTO,
    PersonDTO,
} from "@clanscore/shared";
import {
    disableButtons,
    getChannelByName,
    sendRewardInfoToChannel,
} from "../../utils-discord/guild";
import { withRoleAccess } from "../../utils-discord/accessControl";
import { replyWithDeferredError } from "../../errors/dsicordAdapter";
import { api } from "../../api/apiClient";
import { acceptRewardClaim, denyRewardClaim } from "../../intergration/leaderboard-discord.service";

export const data = new SlashCommandBuilder()
    .setName("rewards")
    .setDescription("Zeigt alle verfügbaren Belohnungen für Punkte.");

async function handleRewardCommand(
    interaction: CommandInteraction,
): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId as string;

    const targetChannel = await getChannelByName(guildId, ChannelNames.REWARDS);
    if (!targetChannel.ok) {
        await replyWithDeferredError(interaction, targetChannel.error);
        return;
    }

    const rewardsResult = await api.getRewards();
    if (!rewardsResult.ok) {
        await replyWithDeferredError(interaction, rewardsResult.error);
        return;
    }

    const rewards = rewardsResult.value as RewardDTO[];
    if (rewards.length === 0) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎁 Rewards")
                    .setColor(0xff9800)
                    .setTimestamp()
                    .addFields({
                        name: "Keine Belohnungen verfügbar",
                        value: "Schaue später wieder vorbei, um spannende Belohnungen zu erhalten!",
                    }),
            ],
        });
        return;
    }

    let currentIndex = 0;

    const getComponents = (index: number) => {
        const claim = buildClaimButton(rewards[index].id);
        const nav = buildNavButtons(index, rewards.length);
        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents(claim),
            new ActionRowBuilder<ButtonBuilder>().addComponents(...nav),
        ];
    };

    const message = await interaction.editReply({
        content: buildRewardOverview(rewards, currentIndex),
        embeds: [buildRewardEmbed(rewards[currentIndex])],
        components: getComponents(currentIndex),
    });

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 5 * 60 * 1000, // 5 Minuten
    });

    collector.on("collect", async (i) => {
        try {
            if (i.user.id !== interaction.user.id) {
                await replyWithDeferredError(i, {
                    type: ErrorType.UserNotFound,
                });
                return;
            }

            if (
                i.customId === "next_reward" &&
                currentIndex < rewards.length - 1
            ) {
                currentIndex++;
            } else if (i.customId === "prev_reward" && currentIndex > 0) {
                currentIndex--;
            } else if (i.customId.startsWith("claim_reward:")) {
                const rewardId = i.customId.split(":")[1];
                const reward = rewards[currentIndex];

                const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_claim_reward:${rewardId}`)
                        .setLabel("Ja, bestätigen")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`cancel_claim_reward:${rewardId}`)
                        .setLabel("Abbrechen")
                        .setStyle(ButtonStyle.Danger),
                );

                await i.reply({
                    content: 
`⚠️ Möchtest du die Belohnung **"${reward.name}"** wirklich einfordern?

Kosten: **${reward.pointsCost} Punkte**`,
                    flags: [MessageFlags.Ephemeral],
                    components: [confirmRow],
                });

                const confirmation = await i.channel
                    ?.awaitMessageComponent({
                        componentType: ComponentType.Button,
                        filter: (btnInt) => 
                            btnInt.user.id === i.user.id &&
                            (btnInt.customId === `confirm_claim_reward:${rewardId}` ||
                             btnInt.customId === `cancel_claim_reward:${rewardId}`),
                    })
                    .catch(() => null);

                if (!confirmation || confirmation.customId === `cancel_claim_reward:${rewardId}`) {
                    if (confirmation) {
                        await confirmation.update({
                            content: "❌ Belohnungseinforderung abgebrochen.",
                            components: [],
                        });
                    }
                    return;
                }

                await confirmation.update({
                    content: "⏳ Belohnung wird eingefordert...",
                    components: [],
                });

                const claimRewardResult = await claimReward(
                    rewardId,
                    i.user.id,
                );
                if (!claimRewardResult.ok) {
                    await confirmation.editReply({
                        content: getErrorMessage(claimRewardResult.error),
                    });
                    return;
                }

                const sendMessageResult = await sendRewardInfoToChannel(
                    targetChannel.value.id,
                    rewards[currentIndex],
                    claimRewardResult.value,
                    interaction.user.id,
                );
                if (!sendMessageResult.ok) {
                    await confirmation.editReply({
                        content: 
`Belohnung wurde eingefordert, aber die Benachrichtigung konnte nicht gesendet werden: ${getErrorMessage(sendMessageResult.error)}`,
                    });
                    return;
                }

                await confirmation.editReply({
                    content: 
`🎉 Du hast folgende Belohnung eingefordert: **${rewards[currentIndex].name}**!

Die Belohnung wird nun vom Vorstand geprüft.`,
                });
                return;
            }

            await i.update({
                content: buildRewardOverview(rewards, currentIndex),
                embeds: [buildRewardEmbed(rewards[currentIndex])],
                components: getComponents(currentIndex),
            });
        } catch {
            await replyWithDeferredError(interaction, {
                type: ErrorType.UnknownError,
            });
        }
    });

    collector.on("end", async () => {
        try {
            await message.edit({ components: [] });
        } catch {
            const errorDetails: ErrorDetails = {
                type: ErrorType.UnknownError,
                details: {
                    message: "Message already deleted or expired; cannot clean up components.",
                }
            };
            getErrorMessage(errorDetails);
        }
    });
}

function buildRewardOverview(rewards: RewardDTO[], currentIndex: number) {
    return rewards
        .map((reward, index) => {
            const label = `${index + 1}\\. ${reward.name}`;
            return index === currentIndex ? `**${label}**` : label;
        })
        .join("\n");
}

function buildRewardEmbed(reward: RewardDTO): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(`🎁 ${reward.name}`)
        .setColor(0xff9800)
        .setTimestamp()
        .addFields(
            { name: "Beschreibung", value: reward.description },
            { name: "Kosten", value: `${reward.pointsCost} Punkte` },
        );
}

function buildClaimButton(rewardId: string): ButtonBuilder {
    return new ButtonBuilder()
        .setCustomId(`claim_reward:${rewardId}`)
        .setLabel("Belohnung einfordern")
        .setStyle(ButtonStyle.Primary);
}

function buildNavButtons(index: number, total: number): ButtonBuilder[] {
    return [
        new ButtonBuilder()
            .setCustomId("prev_reward")
            .setEmoji("⏮️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === 0),
        new ButtonBuilder()
            .setCustomId("next_reward")
            .setEmoji("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === total - 1),
    ];
}

async function claimReward(
    rewardId: string,
    userDiscordId: string,
): Promise<Result<TransactionDTO, ErrorDetails>> {
    if (!rewardId) {
        return err(ErrorType.RewardNotFound);
    }

    return api.claimReward(rewardId, userDiscordId) as Promise<
        Result<TransactionDTO, ErrorDetails>
    >;
}

export async function processReward(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [action, transactionId] = interaction.customId.split(":");

    if (!transactionId) {
        return replyWithDeferredError(interaction, {
            type: ErrorType.ValidationError,
            details: { message: "Keine Transaktions-ID angegeben." },
        });
    }

    let messageToUser: string;
    let personDiscordId: string | undefined;
    let rewardName: string | undefined;
    let status: "accept" | "deny";

    if (action === "accept_reward") {
        status = "accept";
        const acceptResult = await acceptRewardClaim(transactionId);
        if (!acceptResult.ok) {
            return replyWithDeferredError(interaction, acceptResult.error);
        }
        const payload = acceptResult.value as unknown as {
            personDiscordId: string;
            rewardName: string;
        };
        personDiscordId = payload.personDiscordId;
        rewardName = payload.rewardName;
        messageToUser = `✅ Deine Belohnung ist auf dem Weg zu dir: **${rewardName}**`;
    } else if (action === "deny_reward") {
        status = "deny";
        const denyResult = await denyRewardClaim(transactionId);
        if (!denyResult.ok) {
            return replyWithDeferredError(interaction, denyResult.error);
        }
        const payload = denyResult.value as unknown as {
            personDiscordId: string;
            rewardName: string;
        };
        personDiscordId = payload.personDiscordId;
        rewardName = payload.rewardName;
        messageToUser = `❌ Deine Belohnung wurde abgelehnt: **${rewardName}**`;
    } else {
        return replyWithDeferredError(interaction, {
            type: ErrorType.ValidationError,
            details: { message: "Unbekannte Reward-Aktion." },
        });
    }

    let person: PersonDTO | undefined;
    if (personDiscordId) {
        const personResult = await api.getPersonByDiscordId(personDiscordId);
        if (personResult.ok) {
            person = personResult.value;
        }
    }

    if (personDiscordId) {
        try {
            const user = await interaction.client.users.fetch(personDiscordId);
            await user.send(messageToUser);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorDetails: ErrorDetails = {
                type: ErrorType.MessageNotSend,
                details: {
                    message: `DM an ${personDiscordId} fehlgeschlagen - sende keine Nachricht: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    const originalChannel = interaction.channel;
    if (originalChannel && originalChannel.isTextBased() && rewardName && person) {
        try {
            const decisionText = status === "accept" ? "✅ **Akzeptiert**" : "❌ **Abgelehnt**";
            const decisionColor = status === "accept" ? 0x00ff00 : 0xff0000;
            
            const decisionMaker = interaction.user;
            
            const decisionEmbed = new EmbedBuilder()
                .setTitle(`${decisionText} - Belohnung: ${rewardName}`)
                .setColor(decisionColor)
                .addFields(
                    { name: "Belohnung", value: rewardName, inline: false },
                    { name: "Antragsteller", value: `<@${personDiscordId}> (${person.nickname || `${person.firstName} ${person.lastName}`})`, inline: false },
                    { name: "Entscheidung", value: status === "accept" ? "Akzeptiert" : "Abgelehnt", inline: true },
                    { name: "Transaktions-ID", value: transactionId, inline: true },
                    { name: "Entscheidung von", value: `<@${decisionMaker.id}> (${decisionMaker.username})`, inline: false },
                )
                .setTimestamp();

            await (originalChannel as TextChannel).send({
                embeds: [decisionEmbed],
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails: ErrorDetails = {
                type: ErrorType.MessageNotSend,
                details: {
                    message: `Failed to send decision message to channel: ${errorMessage}`,
                }
            };
            getErrorMessage(errorDetails);
        }
    }

    await interaction.editReply({
        content: `✅ Belohnung wurde verarbeitet.`,
    });

    const overviewMessage = await interaction.message.fetch();
    await overviewMessage.edit({
        components: disableButtons(overviewMessage, [
            "accept_reward",
            "deny_reward",
        ]),
    });

    return ok(undefined);
}

export const execute = withRoleAccess(handleRewardCommand, [
    "Vorstand",
    "Mitglied",
]);
