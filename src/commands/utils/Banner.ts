import {
    Message,
    EmbedBuilder
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

@CommandDecorator({
    name: 'banner',
    description: 'Affiche la bannière du membre voulu.',
    cooldown: 1,
    permissions: [],
    category: 'utils',
    usage: 'banner [\'color\'] [user]',
    aliases: ['bannière']
})
export default class BannerCommand extends CommandModule {
    public async execute(client: Bot, t:TFunction, command: Message, args: string[]): Promise<void | Message> {
        if (args[0] === 'color') {
            const user = await this.getMemberFromArg(command.guild, args[1] ?? command.author.id)
            if (!user)
                return command.reply(t('commands.utils.banner.noUser'))

            const fetchedUser = await user.user.fetch()
            if (!fetchedUser.hexAccentColor) {
                return command.reply({
                    content: t('commands.utils.banner.noBanner', { user: `${user}` }),
                    allowedMentions: { parse: [] }
                })
            }
            const embed = new EmbedBuilder()
                .setDescription(`**[${fetchedUser.hexAccentColor}](https://colorhexa.com/${fetchedUser.hexAccentColor})**`)
                .setColor(fetchedUser.hexAccentColor)

            return command.reply({
                content: t('commands.utils.banner.bannerColor', { user: `${user}`, color: fetchedUser.hexAccentColor }),
                embeds: [ embed ],
                allowedMentions: { parse: [] }
            })
        }
        const user = await this.getMemberFromArg(command.guild, args[0] ?? command.author.id)
        if (!user)
            return command.reply(t('commands.utils.banner.noUser'))

        const fetchedUser = await user.user.fetch()
        const bannerUrl = fetchedUser.bannerURL({ size: 4096 })
        return command.reply({
            content: bannerUrl ?
                t('commands.utils.banner.globalBanner', { bannerUrl: bannerUrl, user: `${user}` }) :
                t('commands.utils.banner.noBanner', { user: `${user}` }),
            allowedMentions: { parse: [] }
        })
    }
}