import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    AutocompleteInteraction,
    PermissionsBitField,
    Message,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

@InteractionDecorator({
    name: 'ping',
    description: 'Display the ping of the bot',
    cooldown: 1,
    category: 'utils',
    usage: 'ping',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Display the ping of the bot')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class PingInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<Message> {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true
        })
        const embed = new EmbedBuilder()
            .setTitle(t('commands.utils.ping.success'))
            .setDescription(t('commands.utils.ping.latency', { clientPing: client.ws.ping, apiLatency: sent.createdTimestamp - interaction.createdTimestamp }))
            .setFooter({
                text: t('interactions.embedExecuted', { username: interaction.user.username, botUsername: client.user?.username, version: client.version }),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(`#ffc800`)

        return interaction.editReply({
            content: t('commands.utils.ping.success'),
            embeds: [embed]
        })
    }
}
