import {
    Message,
    EmbedBuilder,
    GuildMember,
    Collection,
    User
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'
import { getSafeEnv } from '@src/utils/TypeGuards.js'

@CommandDecorator({
    name: 'help',
    description: 'Affiche les commandes disponibles.',
    cooldown: 3,
    permissions: [],
    category: 'utils',
    usage: 'help [command]',
    aliases: ['h', 'aide']
})
export default class HelpCommand extends CommandModule {
    public async execute(client: Bot, t:TFunction, command: Message, args: string[]): Promise<void | Message> {
        const commandName: string | undefined = args[0]
        const embed = new EmbedBuilder()
            .setFooter({
                text: t('commands.embedExecuted', { username: command.author.username, botUsername: client.user?.username, version: client.version }),
                iconURL: command.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(`#ffc800`)

        if (commandName) {
            const cmd = client.modules.commands.find(cmd => cmd.name === commandName)

            if (!cmd)
                return command.reply(t('commands.utils.help.commandNotFound', { commandName }))
            embed.setTitle(t('commands.utils.help.commandName', { commandName: cmd.name }))
                .addFields(
                    {
                        name: 'Description',
                        value: cmd.description
                    },
                    {
                        name: 'Usage',
                        value: cmd.usage,
                        inline: true
                    },
                    {
                        name: 'Permissions',
                        value: cmd.permissions.length ? cmd.permissions.map(perm => perm).join(', ') : t('commands.utils.help.noPermissions'),
                        inline: true
                    }
                )
        } else {
            const prefix = command.guildId ? (await client.database.getGuild(command.guildId)).prefix : client.user?.username

            embed.setTitle(t('commands.utils.help.commandsList'))
                .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                .setDescription(t('commands.utils.help.availableCommandsList', {
                    commandList: this._removeCommandWithNoAccess(command.member ?? command.author, client.modules.commands, command, t)
                                    .map((commands) => `\`${prefix}${commands.name}\` - ${commands.description}`)
                                    .join('\n')
                }))
        }
        return command.reply({ embeds: [embed] })
    }

    private _removeCommandWithNoAccess(user: GuildMember | User, commands: Collection<string, CommandModule>, message: Message, t: TFunction): Collection<string, CommandModule> {
        if (user.id === getSafeEnv(process.env.OWNER_ID, 'OWNER_ID'))
            return commands

        const isGuildMember = (user: GuildMember | User): user is GuildMember => (user as GuildMember).permissions !== undefined
        const filteredCommands = new Collection<string, CommandModule>()
        commands.forEach(async (command, key) => {
            if (command.category === 'owner')
                return
            if (isGuildMember(user) && await this.checkPermissions(message, user, command.permissions, t))
                filteredCommands.set(key, command)
        })

        return filteredCommands
    }
}