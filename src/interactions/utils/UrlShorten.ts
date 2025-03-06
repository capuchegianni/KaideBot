import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    InteractionResponse,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

import settings from '../../../settings.json' with { 'type': 'json' }

@InteractionDecorator({
    name: 'urlshorten',
    description: 'Renvoie un nouveau lien pointant sur le lien choisi.',
    cooldown: 3,
    category: 'utils',
    usage: 'urlshorten <url>',
    data: new SlashCommandBuilder()
        .setName('urlshorten')
        .setDescription('Renvoie un nouveau lien pointant sur le lien choisi.')
        .addStringOption(option => option
            .setName('url')
            .setDescription('Le lien à modifier (http://, https://)')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class UrlShortenInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver
        const urlToShorten = options.getString('url')
        const rebrandlyUrl = 'https://api.rebrandly.com/v1/links'
        const data = JSON.stringify({ destination: urlToShorten })
        const response = await fetch(rebrandlyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': settings.rebrandly.API_KEY
            },
            body: data
        })

        if (!response.ok) {
            if (response.status === 400)
                return interaction.reply(t('interactions.utils.urlshorten.invalidUrl'))
            return interaction.reply(t('interactions.execError'))
        }

        const jsonResponse = await response.json()

        return interaction.reply(t('interactions.utils.urlshorten.shortenedUrl', { shortenedUrl: jsonResponse.shortUrl, urlToShorten: urlToShorten }))
    }
}