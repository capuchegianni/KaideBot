import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    InteractionResponse,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

@InteractionDecorator({
    name: 'banner',
    description: 'Affiche la bannière du membre voulu.',
    cooldown: 1,
    category: 'utils',
    usage: 'banner [user]',
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Affiche la bannière du membre voulu.')
        .addUserOption(option => option
            .setName('utilisateur')
            .setDescription('L\'utilisateur voulu')
        )
        .addBooleanOption(option => option
            .setName('couleur')
            .setDescription('Affiche la couleur de la bannière plutôt que l\'image.')
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class AvatarInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver
        const user = options.getUser('utilisateur') ?? interaction.user
        const isColor = options.getBoolean('couleur') ?? false
        const fetchedUser = await user.fetch()
        const bannerUrl = fetchedUser.bannerURL({ size: 4096 })

        if (isColor) {
            if (!fetchedUser.hexAccentColor) {
                return interaction.reply({
                    content: t('commands.utils.banner.noBanner', { user: `${fetchedUser}` }),
                    allowedMentions: { parse: [] }
                })
            }
            const embed = new EmbedBuilder()
                .setDescription(`**[${fetchedUser.hexAccentColor}](https://colorhexa.com/${fetchedUser.hexAccentColor})**`)
                .setColor(fetchedUser.hexAccentColor)

            return interaction.reply({
                content: t('commands.utils.banner.bannerColor', { user: `${user}`, color: fetchedUser.hexAccentColor }),
                embeds: [ embed ],
                allowedMentions: { parse: [] }
            })
        }
        return interaction.reply({
            content: bannerUrl ?
                t('commands.utils.banner.globalBanner', { bannerUrl: bannerUrl, user: `${user}` }) :
                t('commands.utils.banner.noBanner', { user: `${user}` }),
            allowedMentions: { parse: [] }
        })
    }
}