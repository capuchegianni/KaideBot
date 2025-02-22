import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    GuildMember,
    InteractionResponse,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

@InteractionDecorator({
    name: 'avatar',
    description: 'Affiche la photo de profil du membre voulu.',
    cooldown: 1,
    category: 'utils',
    usage: 'avatar [user]',
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Affiche la photo de profil du membre voulu.')
        .addUserOption(option => option
            .setName('utilisateur')
            .setDescription('L\'utilisateur voulu')
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class AvatarInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver
        const member = (options.getMember('utilisateur') ?? interaction.member) as GuildMember | null
        const userFromOptions = options.getUser('utilisateur') ?? interaction.user
        const user = member && member.user && 'displayAvatarURL' in member.user ? member.user : userFromOptions
        const localAvatarURL = member && 'avatarUrl' in member ? member.avatarURL({ size: 4096 }) : null
        const globalAvatarURL = user.displayAvatarURL({ size: 4096 })

        if (localAvatarURL) {
            return interaction.reply({
                content: t('commands.utils.avatar.localPfp', { localUrl: localAvatarURL, globalUrl: globalAvatarURL, user: `${member}` }),
                allowedMentions: { parse: [] }
            })
        }
        return interaction.reply({
            content: t('commands.utils.avatar.globalPfp', { globalUrl: globalAvatarURL, user: `${member}` }),
            allowedMentions: { parse: [] }
        })
    }
}