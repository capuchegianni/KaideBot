import {
    SlashCommandBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    AutocompleteInteraction,
    PermissionsBitField,
    Collection,
    InteractionResponse,
    Interaction,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import Fuse from 'fuse.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'
import { getSafeEnv, isTruthy } from '@src/utils/TypeGuards.js'

@InteractionDecorator({
    name: 'help',
    description: 'Affiche les intéractions disponibles.',
    cooldown: 3,
    category: 'utils',
    usage: 'help [interaction]',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche les intéractions disponibles.')
        .addStringOption((option) => option
            .setName('commande')
            .setDescription('La commande à afficher')
            .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class Help extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> {
        const options = interaction.options as CommandInteractionOptionResolver
        const focusedValue = options.getFocused()
        const interactions = this._removeInteractionWithNoAccess(interaction, client.modules.interactions).map(interaction => ({
            name: interaction.name,
            interaction
        }))

        if (!focusedValue) {
            return interaction.respond(
                interactions.map(interaction => ({ name: interaction.name, value: interaction.name }))
            )
        }

        const fuse = new Fuse(interactions, {
            keys: ['name'],
            threshold: 0.2
        })
        const result = fuse.search(focusedValue)

        await interaction.respond(
            result.map(choice => ({ name: choice.item.name, value: choice.item.name }))
        )
    }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver
        const interactionName = options.getString('commande')
        const embed = new EmbedBuilder()
            .setFooter({
                text: t('interactions.embedExecuted', { username: interaction.user.username, botUsername: client.user?.username, version: client.version }),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(`#ffc800`)

        if (interactionName) {
            const cmd = client.modules.interactions.find(int => int.data && int.data.name === interactionName)

            if (!cmd) {
                return interaction.reply({
                    content: t('interactions.utils.help.interactionNotFound', { interactionName: interactionName }),
                    ephemeral: true
                })
            }
            embed.setTitle(t('interactions.utils.help.interactionName', { interactionName: cmd.data.name }))
                .addFields(
                    {
                        name: 'Description',
                        value: cmd.data.description
                    },
                    {
                        name: 'Usage',
                        value: `\`/${cmd.data.name}\``,
                        inline: true
                    },
                    {
                        name: 'Permissions',
                        value: this._formatPermission(cmd.data.default_member_permissions, t),
                        inline: true
                    },
                    {
                        name: 'Options',
                        value: cmd.data.options.length ? `>>> ${cmd.data.options.map((option) => `\`${option.toJSON().name}\`: ${option.toJSON().description} - ${option.toJSON().required ? t('interactions.utils.help.options.required') : t('interactions.utils.help.options.optional')}`).join('\n')}` : t('interactions.utils.help.options.noOptions')
                    }
                )
        } else {
            embed.setTitle(t('interactions.utils.help.interactionsList'))
                .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                .setDescription(t('interactions.utils.help.availableInteractionsList', {
                    interactionList: this._removeInteractionWithNoAccess(interaction, client.modules.interactions)
                        .map((interactions) => `\`/${interactions.data.name}\` - ${interactions.data.description}`)
                        .join('\n')
                }))
        }
        return interaction.reply({ embeds: [embed] })
    }

    private _formatPermission(permissionValue: string | null | undefined, t: TFunction): string {
        if (!isTruthy(permissionValue))
            return t('interactions.utils.help.noPermissions')

        const permissionBigInt = BigInt(permissionValue)
        return Object.keys(PermissionsBitField.Flags).find(key =>
            PermissionsBitField.Flags[key as keyof typeof PermissionsBitField.Flags] === permissionBigInt
        ) || t('interactions.utils.help.noPermissions')
    }

    private _removeInteractionWithNoAccess(interaction: Interaction, interactions: Collection<string, InteractionModule>): Collection<string, InteractionModule> {
        if (interaction.user.id === getSafeEnv(process.env.OWNER_ID, 'OWNER_ID'))
            return interactions

        const filteredInteractions = new Collection<string, InteractionModule>()
        interactions.forEach((int, key) => {
            if (!int.data.default_member_permissions)
                return
            if (int.category === 'owner')
                return
            if (interaction.memberPermissions?.has(BigInt(int.data.default_member_permissions)))
                filteredInteractions.set(key, int)
        })

        return filteredInteractions
    }
}