import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ApplicationIntegrationType,
    InteractionContextType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    PermissionsBitField
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

const logger = Logger.getInstance('')

@InteractionDecorator({
    name: 'ratio',
    description: 'Parce que c\'est fun de ratio quelqu\'un',
    cooldown: 1,
    category: 'fun',
    usage: 'ratio <user>',
    data: new SlashCommandBuilder()
        .setName('ratio')
        .setDescription('Parce que c\'est fun de ratio quelqu\'un.')
        .addUserOption(option => option
            .setName('user')
            .setDescription('La personne à ratio')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
})
export default class RatioInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t:TFunction, interaction: ChatInputCommandInteraction): Promise<any> {
        const options = interaction.options as CommandInteractionOptionResolver
        const user = interaction.user
        const userToRatio = options.getUser('user', true)
        const userIds: string[] = []
        let ratioNbr = 0
        let flopNbr = 0

        try {
            const ratio = new ButtonBuilder().setCustomId('ratio').setLabel(ratioNbr + ' ratio').setStyle(ButtonStyle.Success)
            const flop = new ButtonBuilder().setCustomId('flop').setLabel(flopNbr + ' flop').setStyle(ButtonStyle.Danger)
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(ratio, flop)
            const msg = await interaction.reply({
                content: t('commands.fun.ratio.wantToRatio', { user: `${user}`, userToRatio: `${userToRatio}` }),
                components: [row]
            })
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 1000 * 60
            })

            collector.on('collect', async i => {
                if (userIds.includes(i.user.id))
                    return i.reply({ content: t('commands.fun.ratio.oneVote'), ephemeral: true })

                let reply = ''

                userIds.push(i.user.id)
                if (i.customId === 'ratio') {
                    ratioNbr++
                    reply = `Ratio ${userToRatio.username}`
                }
                if (i.customId === 'flop') {
                    flopNbr++
                    reply = `Flop ${user.username}`
                }
                row.components[0].setLabel(ratioNbr + ' ratio')
                row.components[1].setLabel(flopNbr + ' flop')
                msg.edit({ components: [row] })
                return i.reply({ content: reply, ephemeral: true })
            })
            setTimeout(async () => {
                msg.edit({ components: [] })
                await interaction.followUp(ratioNbr > flopNbr ? `RATIOOOOOO ${userToRatio}` : `FLOOOOOOOOP ${user}`)
            }, 1000 * 60)
        } catch (error: any) {
            logger.log(client, error, 'error')
        }
    }
}