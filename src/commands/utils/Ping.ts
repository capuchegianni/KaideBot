import { Message, EmbedBuilder } from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

@CommandDecorator({
    name: 'ping',
    description: 'Affiche le temps de latence du bot.',
    cooldown: 1,
    permissions: [],
    category: 'utils',
    usage: 'ping',
    aliases: []
})
export default class PingCommand extends CommandModule {
    public async execute(client: Bot, t: TFunction, command: Message): Promise<void> {
        const sent = await command.reply({
            content: 'Pinging...',
        })
        const embed = new EmbedBuilder()
            .setTitle(t('commands.utils.ping.success'))
            .setDescription(t('commands.utils.ping.latency', { clientPing: client.ws.ping, apiLatency: sent.createdTimestamp - command.createdTimestamp }))
            .setFooter({
                text: t('commands.embedExecuted', { username: command.author.username, botUsername: client.user?.username, version: client.version }),
                iconURL: command.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(`#ffc800`)

        sent.edit({
            content: t('commands.utils.ping.success'),
            embeds: [embed]
        })
    }
}
