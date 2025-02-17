import {
    Message,
    User,
    EmbedBuilder,
    GuildMember,
    Collection
} from 'discord.js'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { CommandModule, EventModule } from '@src/classes/ModuleImports.js'
import Puns from '@src/classes/Puns.js'
import { EventDecorator } from '@src/utils/Decorators.js'
import {
    getSafeEnv,
    isBot,
    isTruthy
} from '@src/utils/TypeGuards.js'

const logger = Logger.getInstance('')
const puns = new Puns()

@EventDecorator({
    name: 'messageCreate',
    eventType: 'on'
})
export default class MessageCreate extends EventModule {
    public async execute(client: Bot, message: Message): Promise<void> {
        if (!message.guild || !message.guildId || message.author.bot || !client.user)
            return

        try {
            await client.database.addServerFromMessage(message)
            await client.database.addChannelFromMessage(message)
            await client.database.addUserFromMessage(message)

            const userLang = await this.getUserLanguage(client, message.author.id)
            const t = client.translations.getFixedT(userLang)

            const prefix: string = (await client.database.getGuild(message.guildId)).prefix
            const maintenance = await this._botIsInMaintenance(client, message.author)
            if (this._detectName(client.user, message, prefix))
                return

            if (!message.content.startsWith(prefix) && !message.content.startsWith(client.user.username.toLowerCase()) && maintenance) {
                puns.getPun(client, message)
                return
            }

            const usingPrefix: boolean = !message.content.startsWith(client.user.username.toLowerCase())
            const args: string[] = message.content.slice(usingPrefix ? prefix.length : client.user.username.length).trim().split(/ +/g)
            const commandName: string | undefined = args.shift()?.toLowerCase()
            if (!isTruthy(commandName))
                return

            const command = client.modules.commands.get(commandName) ?? client.modules.commands.find((cmd) => cmd.aliases.includes(commandName))
            if (!command)
                return

            if (maintenance) {
                message.reply(t('error.maintenance', { botName: client.user.username }))
                return
            }

            const commandFromDb = await client.database.Command.findByPk(command.name)
            if ((!commandFromDb || !commandFromDb.get().enabled) && message.author.id !== getSafeEnv(process.env.OWNER_ID, 'OWNER_ID')) {
                await message.reply('Cette commande est désactivée.')
                return
            }
            if (!this._getCooldown(client.cooldowns, message, command))
                return
            if (!message.member || !this._hasPermissions(message.member, command)) {
                message.reply(`Vous n'avez pas les permissions nécessaires pour éxécuter la commande ${command.name}.`)
                return
            }

            await command.execute(client, t, message, args)

            logger.simpleLog(`${message.author.username} executed the ${commandName} command in ${message.channelId}.`)
            logger.logDiscordEmbed(client, new EmbedBuilder()
                .setTitle('Commande exécutée ✅')
                .setDescription(`**Auteur:** ${message.author} (${message.author.id})\n**Salon:** ${message.channel} (${message.channel.id})\n**Serveur:** ${message.guild} (${message.guild.id})\n**commande:** ${commandName}`)
                .setFooter({
                    text: `Commande exécutée par ${message.author.username} | ${client.user.username}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(`#00ff00`)
            )
        } catch (error: any) {
            logger.simpleError(error)
            logger.logDiscordEmbed(client, new EmbedBuilder()
                .setTitle(`Une erreur est survenue ❌`)
                .setFields({
                    name: 'Message',
                    value: message.content
                })
                .setDescription(`\`\`\`${error}\`\`\``)
                .setFooter({
                    text: `Message envoyé par ${message.author.username} | ${client.user.username}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setColor('#ff0000')
                .setTimestamp()
            )
        }
    }

    private _detectName(user: User, message: Message, prefix: string): boolean {
        const channel = message.channel

        if (message.content.toLowerCase() === user.username.toLowerCase() && channel.isSendable()) {
            channel.send(`Bonjour!\n\nJe suis **${user.username}** le bot du goat __capuchegianni__.\nLe préfixe du bot est \`${prefix}\` mais il est tout à fait possible de le modifier.\nFaites \`/help prefix\` pour plus d'informations.`)
            return true
        }
        return false
    }

    private async _botIsInMaintenance(client: Bot, user: User): Promise<boolean> {
        const bot = (await client.database.Bot.findByPk(client.user?.id))?.get()

        return (isBot(bot) && bot.maintenance && user.id !== getSafeEnv(process.env.OWNER_ID, 'OWNER_ID'))
    }

    private _hasPermissions(member: GuildMember, command: CommandModule): boolean {
        if (member.id === getSafeEnv(process.env.OWNER_ID, 'OWNER_ID') || !command.permissions.length)
            return true
        if (command.category === 'owner')
            return false
        for (const permission of command.permissions) {
            if (!member.permissions.has(permission))
                return false
        }
        return true
    }

    private _getCooldown(cooldowns: Collection<string, Collection<string, number>>, message: Message, command: CommandModule): boolean {
        if (!cooldowns.has(command.name))
            cooldowns.set(command.name, new Collection())

        const now = Date.now()
        const commandTimestamps = cooldowns.get(command.name)
        const cooldown = command.cooldown * 1000

        if (commandTimestamps?.has(message.author.id)) {
            const timestamp = commandTimestamps.get(message.author.id)

            if (timestamp) {
                const expirationTime = timestamp + cooldown
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000)

                    message.reply(`Veuillez attendre <t:${expiredTimestamp}:R> avant de pouvoir effectuer la commande à nouveau.`)
                    return false
                }
            }
        }
        commandTimestamps?.set(message.author.id, now)
        setTimeout(() => commandTimestamps?.delete(message.author.id), cooldown)
        return true
    }
}