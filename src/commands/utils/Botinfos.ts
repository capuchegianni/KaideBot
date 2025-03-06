import {
    Message,
    EmbedBuilder
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'
import { isBot } from '@src/utils/TypeGuards.js'

@CommandDecorator({
    name: 'botinfos',
    description: 'Affiche des informations utiles sur le bot.',
    cooldown: 1,
    permissions: [],
    category: 'utils',
    usage: 'botinfos',
    aliases: ['bi']
})
export default class BotinfosCommand extends CommandModule {
    public async execute(client: Bot, t:TFunction, command: Message, args: string[]): Promise<void | Message> {
        const bot = (await client.database.Bot.findByPk(client.user?.id))?.get()
        if (!isBot(bot) || !client.user)
            return command.reply(t('commands.execError'))

        const embed = new EmbedBuilder()
            .setTitle(t('commands.utils.botinfos.botInfos', { bot: `${client.user.username}` }))
            .addFields(
                { name: 'Uptime', value: t('commands.utils.botinfos.uptime', { bot: `${client.user}`, time: `<t:${Math.floor((Date.now() - client.uptime!) / 1000)}:R>` }), inline: true },
                { name: t('commands.utils.botinfos.startDate'), value: `<t:${Math.floor(client.readyTimestamp! / 1000)}>`, inline: true },
                { name: t('commands.utils.botinfos.createDate'), value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true},
                { name: t('commands.utils.botinfos.ramUsage.name'), value: t('commands.utils.botinfos.ramUsage.value', { bot: `${client.user}`, ramUsage: client.getRamUsage }) },
                { name: t('commands.utils.botinfos.totalServers'), value: `${client.guilds.cache.size}`, inline: true },
                { name: t('commands.utils.botinfos.totalUsers'), value: `${client.users.cache.size}`, inline: true},
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Bot version', value: client.version, inline: true },
                { name: 'Node.js version', value: process.version, inline: true}
            )
            .setImage(client.user.displayAvatarURL())
            .setFooter({
                text: t('commands.embedExecuted', { username: command.author.username, botUsername: client.user.username, version: client.version }),
                iconURL: command.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(`#ffc800`)

        return command.reply({ embeds: [embed] })
    }
}