import { Message } from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

@CommandDecorator({
    name: 'avatar',
    description: 'Affiche la photo de profil du membre voulu.',
    cooldown: 1,
    permissions: [],
    category: 'utils',
    usage: 'avatar [user]',
    aliases: ['pp', 'pdp', 'pfp']
})
export default class AvatarCommand extends CommandModule {
    public async execute(client: Bot, t:TFunction, command: Message, args: string[]): Promise<void | Message> {
        const user = await this.getMemberFromArg(command.guild, args[0] ?? command.author.id)
        if (!user)
            return command.reply(t('commands.utils.avatar.noUser'))

        const globalAvatarURL = user.user.displayAvatarURL({ size: 4096 })
        const localAvatarURL = user.avatarURL({ size: 4096 })

        if (localAvatarURL) {
            return command.reply({
                content: t('commands.utils.avatar.localPfp', { localUrl: localAvatarURL, globalUrl: globalAvatarURL, user: `${user}` }),
                allowedMentions: { parse: [] }
            })
        }
        return command.reply({
            content: t('commands.utils.avatar.globalPfp', { globalUrl: globalAvatarURL, user: `${user}` }),
            allowedMentions: { parse: [] }
        })
    }
}