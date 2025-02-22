import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    ButtonInteraction,
    GuildMember,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    InteractionResponse,
    Message,
    RoleSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ApplicationIntegrationType,
    InteractionContextType
} from 'discord.js'
import { Model } from 'sequelize'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { TTwitch } from '@src/types/Twitch.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

const logger = Logger.getInstance('')

@InteractionDecorator({
    name: 'twitch',
    description: 'Configuration des notifications twitch sur votre serveur.',
    cooldown: 5,
    category: 'administration',
    usage: 'twitch <set | remove | enable>',
    data: new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('Configuration des notifications twitch sur votre serveur.')
        .addSubcommand(command => command
            .setName('set')
            .setDescription('Créé ou modifie la notification twitch du serveur.')
        )
        .addSubcommand(command => command
            .setName('remove')
            .setDescription('Supprime la notification twitch du serveur.')
        )
        .addSubcommand(command => command
            .setName('enable')
            .setDescription('Active ou désactive la notification twitch.')
            .addBooleanOption(option => option
                .setName('toenable')
                .setDescription('True / False')
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
})
export default class TwitchInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse> {
        if (!await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t))
            return
        if (client.set.has(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))) {
            return interaction.reply({
                content: 'Cette intéraction est déjà en court d\'éxécution sur ce serveur.',
                ephemeral: true
            })
        }

        const options = interaction.options as CommandInteractionOptionResolver

        switch (options.getSubcommand()) {
            case 'set':
                return this._setTwitchNotification(client, interaction)
            case 'remove':
                return this._removeTwitchNotification(client, interaction)
            case 'enable':
                return this._enableTwitchNotification(client, interaction)
        }
    }

    private async _setTwitchNotification(client: Bot, interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse> {
        client.set.add(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))

        try {
            const [notification, isCreated] = await client.database.TwitchNotification.findOrCreate({
                where: {
                    serverId: interaction.guildId!
                },
                defaults: {
                    serverId: interaction.guildId!,
                    streamer: interaction.user.username,
                    channelId: interaction.channelId
                }
            })

            if (isCreated)
                return this._askForCreation(client, interaction, notification)
            else
                return this._setEmbedResponse(client, interaction, notification)
        } catch (error: any) {
            logger.log(client, error, 'error')
            client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _askForCreation(client: Bot, interaction: ChatInputCommandInteraction, notification: Model<TTwitch, any>): Promise<void> {
        const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continuer').setStyle(ButtonStyle.Secondary).setEmoji('✅')
        const stopButton = new ButtonBuilder().setCustomId('stop').setLabel('Annuler').setStyle(ButtonStyle.Secondary).setEmoji('❌')
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton, stopButton)
        const response = await interaction.reply({
            content: 'Aucune notification twitch n\'est configurée sur ce serveur. Voulez-vous continuer ?',
            components: [row]
        })
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 1000 * 30,
            max: 1
        })
        const button: ButtonInteraction[] = []

        collector.on('collect', collectedInteraction => {
            collectedInteraction.deferUpdate()
            button.push(collectedInteraction)
        })
        collector.on('end', async () => {
            if (!button.length || button[0].customId === 'stop') {
                return response.edit({
                    content: 'Vous avez annulé l\'opération.',
                    components: []
                })
            }
            if (button.length && button[0].customId === 'continue')
                return this._setEmbedResponse(client, interaction, notification, response)
        })
    }

    private async _setEmbedResponse(client: Bot, interaction: ChatInputCommandInteraction, notification: Model<TTwitch, any>, response?: InteractionResponse): Promise<void> {
        const rows = this._createButtons(notification.get().channelId, notification.get().roleId)
        const embed = new EmbedBuilder()
            .setTitle(`Configuration de ${client.user?.username} en stream!`)
            .addFields(
                { name: 'Viewers', value: `${Math.floor(Math.random() * 10000)}`, inline: true },
                { name: 'Lien', value: `https://twitch.tv/${notification.get().streamer.toLowerCase()}`, inline: true },
                { name: 'Jeu', value: 'Just chatting', inline: true },
                { name: 'Tags', value: 'Aucun tag configuré' }
            )
            .setImage('https://cdn.discordapp.com/attachments/1169234170355142686/1169660918234357880/live_user_capuchegianni-1920x1080.png?ex=6556369e&is=6543c19e&hm=9a9a2bdc8658a2092db02cb4ed6bf318a504a6fa66258b273313cf46d2bfeef9&')
            .setColor('#ffc800')
            .setFooter({
                text: `${notification.get().streamer} est en live!`,
                iconURL: client.user?.displayAvatarURL()
            })
            .setTimestamp()

        if (response) {
            await response.edit({
                content: `${notification.get().streamer} est en live!`,
                components: [rows[0], rows[3]],
                embeds: [embed]
            })
            return this._configureNotification(client, interaction, notification, rows, response)
        } else {
            const message = notification.get().message?.replaceAll('{streamer}', notification.get().streamer).replaceAll('{game}', 'gameName')
            const messageWithMention = notification.get().roleId ? `||<@&${notification.get().roleId}>||\n\n${message}` : message
            const response = await interaction.reply({
                content: messageWithMention,
                components: [rows[0], rows[3]],
                embeds: [embed]
            })

            return this._configureNotification(client, interaction, notification, rows, response)
        }
    }

    private async _configureNotification(client: Bot, interaction: ChatInputCommandInteraction, notification: Model<TTwitch, any>, rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder>[], response: InteractionResponse): Promise<void> {
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 1000 * 60 * 15,
            idle: 1000 * 60 * 5
        })
        let currentRowId = 0

        collector.on('collect', async (collectedInteraction: ButtonInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction) => {
            if (collectedInteraction.customId !== 'inputs')
                await collectedInteraction.deferUpdate()

            const collectedInteractionChannel = collectedInteraction.channel
            const handlers: { [key: string]: () => Promise<void | Message | InteractionResponse> } = {
                'continue': () => {
                    currentRowId++
                    rows[3].components[0].setDisabled(false)
                    if (currentRowId === 2)
                        rows[3].components[1].setDisabled(true)
                    return response.edit({ components: [rows[currentRowId], rows[3]] })
                },
                'back': () => {
                    currentRowId--
                    rows[3].components[1].setDisabled(false)
                    if (!currentRowId)
                        rows[3].components[0].setDisabled(true)
                    return response.edit({ components: [rows[currentRowId], rows[3]] })
                },
                'cancel': async () => {
                    collector.stop()
                    if (collectedInteractionChannel?.isSendable())
                        return collectedInteractionChannel.send('Vous avez annulé l\'opération')
                },
                'register': async () => {
                    try {
                        if (notification.get().channelId !== interaction.channelId) {
                            const newChannel = client.channels.cache.get(notification.get().channelId)

                            if (newChannel && newChannel.isTextBased() && !newChannel.isDMBased()) {
                                await client.database.Channel.upsert({
                                    id: newChannel.id,
                                    name: newChannel.name,
                                    serverId: newChannel.guildId
                                })
                            }
                        }
                        await notification.save()
                        if (collectedInteractionChannel?.isSendable())
                            await collectedInteractionChannel.send('Tous vos changements ont été enregistrés avec succès.')
                    } catch (error: any) {
                        logger.log(client, error, 'error')
                        await interaction.followUp({
                            content: 'Une erreur est survenue lors de la création de la notification, si l\'erreur se répète veuillez contacter le développeur.',
                            ephemeral: true
                        })
                        await response.edit({ components: [] })
                    }
                    return collector.stop()
                },
                'default': async () => {
                    if (collectedInteraction.customId !== 'inputs')
                        await response.edit({ components: [] })
                    await this._handleRowInteractions(interaction, collectedInteraction, notification, rows)

                    const embed = new EmbedBuilder()
                        .setTitle(`Configuration de ${client.user?.username} en stream!`)
                        .addFields(
                            { name: 'Viewers', value: `${Math.floor(Math.random() * 10000)}`, inline: true },
                            { name: 'Lien', value: `https://twitch.tv/${notification.get().streamer.toLowerCase()}`, inline: true },
                            { name: 'Jeu', value: 'Just chatting', inline: true },
                            { name: 'Tags', value: 'Aucun tag configuré' }
                        )
                        .setImage('https://cdn.discordapp.com/attachments/1169234170355142686/1169660918234357880/live_user_capuchegianni-1920x1080.png?ex=6556369e&is=6543c19e&hm=9a9a2bdc8658a2092db02cb4ed6bf318a504a6fa66258b273313cf46d2bfeef9&')
                        .setColor('#ffc800')
                        .setFooter({
                            text: `${notification.get().streamer} est en live!`,
                            iconURL: client.user?.displayAvatarURL()
                        })
                        .setTimestamp()
                    const message = notification.get().message?.replaceAll('{streamer}', notification.get().streamer).replaceAll('{game}', 'gameName')
                    const messageWithMention = notification.get().roleId ? `||<@&${notification.get().roleId}>||\n\n${message}` : message

                    return response.edit({
                        content: messageWithMention,
                        embeds: [embed],
                        components: [rows[currentRowId], rows[3]]
                    })
                },
            }

            await (handlers[collectedInteraction.customId] || handlers['default'])()
        })
        collector.on('end', async () => {
            client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
            await response.edit({ components: [] })
        })
    }

    private async _handleRowInteractions(interaction: ChatInputCommandInteraction, collectedInteraction: ButtonInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction, notification: Model<TTwitch, any>, rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder>[]): Promise<void | Message | InteractionResponse> {
        const handlers: { [key: string]: () => Promise<void | Message | InteractionResponse> } = {
            'inputs': async () => {
                const modal = new ModalBuilder().setCustomId('modal').setTitle('Modal')
                const streamerModal = new TextInputBuilder().setCustomId('streamer').setLabel('Nom du streamer').setMinLength(4).setMaxLength(25).setStyle(TextInputStyle.Short).setValue(notification.get().streamer).setRequired(true)
                const newMessageModal = new TextInputBuilder().setCustomId('baseMessage').setLabel('Nouveau message').setMaxLength(256).setStyle(TextInputStyle.Paragraph).setValue(notification.get().message || '').setRequired(false)
                const updateMessageModal = new TextInputBuilder().setCustomId('updateMessage').setLabel('Message d\'update').setMaxLength(256).setStyle(TextInputStyle.Paragraph).setValue(notification.get().updateMessage || '').setRequired(false)
                const streamerRow = new ActionRowBuilder<TextInputBuilder>().addComponents(streamerModal)
                const newMessageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(newMessageModal)
                const updateMessageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(updateMessageModal)

                modal.addComponents(streamerRow, newMessageRow, updateMessageRow)
                await collectedInteraction.showModal(modal)

                try {
                    const collector = await interaction.awaitModalSubmit({
                        filter: i => i.user.id === interaction.user.id,
                        time: 1000 * 60 * 10,
                        idle: 1000 * 60 * 5
                    })
                    const streamer = collector.fields.getTextInputValue('streamer')
                    const newMessage = collector.fields.getTextInputValue('baseMessage')
                    const updateMessage = collector.fields.getTextInputValue('updateMessage')

                    notification.set({
                        streamer: streamer,
                        message: newMessage,
                        updateMessage: updateMessage
                    })
                    return collector.reply({
                        content: 'Les données ont été enregistrées localement avec succès.',
                        ephemeral: true
                    })
                } catch { }
            },
            'mention': async () => {
                if (!collectedInteraction.isRoleSelectMenu())
                    return
                const roles = collectedInteraction.values
                const roleSelectMenu = rows[2].components[0] as RoleSelectMenuBuilder

                roleSelectMenu.setDefaultRoles(roles)
                notification.set({ roleId: roles.length > 0 ? roles[0] : null })
                return collectedInteraction.followUp({
                    content: 'La mention a été mise à jour localement avec succès.',
                    ephemeral: true
                })
            },
            'channel': async () => {
                if (!collectedInteraction.isChannelSelectMenu())
                    return
                const channels = collectedInteraction.values
                const channelSelectMenu = rows[1].components[0] as ChannelSelectMenuBuilder

                if (!channels.length) {
                    return collectedInteraction.followUp({
                        content: 'Veuillez spécifier un salon où envoyer les notifications twitch.',
                        ephemeral: true
                    })
                }
                channelSelectMenu.setDefaultChannels(channels)
                notification.set({ channelId: channels[0] })
                return collectedInteraction.followUp({
                    content: 'Le salon a été mis à jour localement avec succès.',
                    ephemeral: true
                })
            },
            'tags': async () => {
                return collectedInteraction.followUp({
                    content: '**Liste des tags disponibles:**\n>>> `-` {streamer}\n`-` {game}',
                    ephemeral: true
                })
            }
        }

        await handlers[collectedInteraction.customId]()
    }

    private _createButtons(channelId: string, roleId: string | null): ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | RoleSelectMenuBuilder>[] {
        const textInputsButton = new ButtonBuilder().setCustomId('inputs').setLabel('Infos').setStyle(ButtonStyle.Secondary)
        const tagsButton = new ButtonBuilder().setCustomId('tags').setLabel('Tags').setStyle(ButtonStyle.Primary)
        const channelSelector = new ChannelSelectMenuBuilder().setCustomId('channel').setPlaceholder('Salon').setDefaultChannels(channelId).setMaxValues(1).setMinValues(1).setChannelTypes(ChannelType.GuildText)
        const mentionSelector = new RoleSelectMenuBuilder().setCustomId('mention').setPlaceholder('Mention').setMinValues(0).setMaxValues(1)

        const continueButton = new ButtonBuilder().setCustomId('continue').setEmoji('➡️').setStyle(ButtonStyle.Primary)
        const backButton = new ButtonBuilder().setCustomId('back').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(true)
        const registerButton = new ButtonBuilder().setCustomId('register').setLabel('Enregistrer').setStyle(ButtonStyle.Success)
        const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Annuler').setStyle(ButtonStyle.Danger)

        if (roleId)
            mentionSelector.setDefaultRoles(roleId)

        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents(textInputsButton, tagsButton),
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelector),
            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(mentionSelector),
            new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, continueButton, cancelButton, registerButton)
        ]
    }

    private async _removeTwitchNotification(client: Bot, interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse> {
        client.set.add(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))

        const t = await client.database.database.transaction()

        try {
            const notification = await client.database.TwitchNotification.findByPk(interaction.guildId!, { transaction: t })
            if (!notification) {
                client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                await t.rollback()
                return interaction.reply('Aucune notification twitch n\'est configurée sur ce serveur.')
            }

            const deleteButton = new ButtonBuilder().setCustomId('delete').setLabel('Supprimer').setStyle(ButtonStyle.Danger)
            const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, deleteButton)
            const response = await interaction.reply({
                content: 'Êtes vous sûr de vouloir supprimer la notification twitch ? Cette action est irréversible.',
                components: [row]
            })
            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                componentType: ComponentType.Button,
                time: 1000 * 60,
                max: 1
            })
            const button: ButtonInteraction[] = []

            collector.on('collect', collectedInteraction => {
                collectedInteraction.deferUpdate()
                button.push(collectedInteraction)
            })
            collector.on('end', async () => {
                if (!button.length || button[0].customId === 'cancel') {
                    client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                    await t.commit()
                    return response.edit({
                        content: 'Vous avez annulé l\'opération.',
                        components: []
                    })
                }
                if (button.length && button[0].customId === 'delete') {
                    await notification.destroy({ transaction: t })
                    await response.edit({
                        content: 'Vous ne recevrez plus de notifications sur ce serveur.',
                        components: []
                    })
                    client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                    await t.commit()
                }
            })
        } catch (error: any) {
            await t.rollback()
            logger.log(client, error, 'error')
            client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _enableTwitchNotification(client: Bot, interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver

        try {
            const [model] = (await client.database.TwitchNotification.findOrCreate({
                where: {
                    serverId: interaction.guildId!
                },
                defaults: {
                    serverId: interaction.guildId!,
                    streamer: interaction.user.username,
                    channelId: interaction.channelId
                }
            }))
            const toEnable = options.getBoolean('toenable', true)

            await model.update({ enabled: toEnable })
            return interaction.reply(`Les notifications twitch ont été ${toEnable ? 'activées' : 'désactivées'} avec succès.`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }
}