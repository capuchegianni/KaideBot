import { Message } from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

const langs: Record<string, string> = {
    fr: 'vous répondra désormais en français.',
    en: 'will now answer you in english.'
}

@CommandDecorator({
    name: 'lang',
    description: 'Renvoie ou modifie la langue avec laquelle le bot vous répond.',
    cooldown: 3,
    permissions: [],
    category: 'utils',
    usage: 'lang [newLang]',
    aliases: ['lg']
})
export default class PrefixCommand extends CommandModule {
    public async execute(client: Bot, t:TFunction, command: Message, args: string[]): Promise<Message | void> {
        const newLang: string | undefined = args[0]

        if (!newLang)
            return command.reply(t('commands.utils.lang.answer', { botName: client.user?.username }))

        if (!(newLang in langs))
            return command.reply(t('commands.utils.lang.codeNotFound', { botName: client.user?.username }))

        await client.database.User.update(
            { lang: newLang },
            { where: { id: command.author.id } }
        )
        return command.reply(`${client.user?.username} ${langs[newLang]}`)
    }
}
