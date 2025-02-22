import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    InteractionResponse,
    GuildMember,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    ChannelSelectMenuBuilder,
    TextInputBuilder,
    ModalBuilder,
    TextInputStyle,
    ChannelType,
    ChannelSelectMenuInteraction,
    StringSelectMenuInteraction,
    EmbedBuilder,
    Message,
    ColorResolvable,
    resolveColor,
    ApplicationIntegrationType,
    InteractionContextType,
} from 'discord.js'
import { Model } from 'sequelize'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { TAnnouncementChannel } from '@src/types/Channel.js'
import { TAnnouncementEmbed } from '@src/types/Embed.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'
import { isString, isTruthy } from '@src/utils/TypeGuards.js'

const logger = Logger.getInstance('')
const responseByType = {
    welcome: 'd\'arrivées',
    leave: 'de départs',
    ban: 'de bans'
}

type AnnouncementType = 'welcome' | 'leave' | 'ban'

@InteractionDecorator({
    name: 'announcements',
    description: 'Configuration des annonces.',
    cooldown: 5,
    category: 'administration',
    usage: 'announcements <welcome | leave | ban> <enable | configure>',
    data: new SlashCommandBuilder()
        .setName('announcements')
        .setDescription('Configuration des annonces.')
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('welcome')
            .setDescription('Configurez les annonces d\'arrivées.')
            .addSubcommand(subCommand => subCommand
                .setName('configure')
                .setDescription('Configuration des annonces d\'arrivées.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('remove')
                .setDescription('Supprimer les annonces d\'arrivées.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('test')
                .setDescription('Testez facilement votre message d\'arrivée.')
            )
        )
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('leave')
            .setDescription('Configurez les annonces de départs.')
            .addSubcommand(subCommand => subCommand
                .setName('configure')
                .setDescription('Configuration des annonces de départs.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('remove')
                .setDescription('Supprimer les annonces de départ.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('test')
                .setDescription('Testez facilement votre message de départ.')
            )
        )
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('ban')
            .setDescription('Configurez les annonces de bans.')
            .addSubcommand(subCommand => subCommand
                .setName('configure')
                .setDescription('Configuration des annonces de bans.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('remove')
                .setDescription('Supprimer les annonces de bans.')
            )
            .addSubcommand(subCommand => subCommand
                .setName('test')
                .setDescription('Testez facilement votre message de ban.')
            )
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
})
export default class AnnouncementsInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<any> {
        if (!await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t))
            return
        if (client.set.has(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))) {
            return interaction.reply({
                content: 'Cette intéraction est déjà en court d\'éxécution sur ce serveur.',
                ephemeral: true
            })
        }

        const options = interaction.options as CommandInteractionOptionResolver

        if (options.getSubcommand() === 'configure')
            return this._configureAnnouncement(client, interaction, options.getSubcommandGroup(true) as AnnouncementType)
        if (options.getSubcommand() === 'remove')
            return this._removeAnnouncement(client, interaction, options.getSubcommandGroup(true) as AnnouncementType)
        if (options.getSubcommand() === 'test')
            return this._testAnnouncement(client, interaction, options.getSubcommandGroup(true) as AnnouncementType)
    }

    private async _configureAnnouncement(client: Bot, interaction: ChatInputCommandInteraction, type: AnnouncementType): Promise<Message | void> {
        client.set.add(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))

        await interaction.deferReply()

        try {
            const [channel, isCreated] = await client.database.AnnouncementChannel.findOrCreate({
                where: {
                    serverId: interaction.guildId!,
                    type: type
                },
                defaults: {
                    serverId: interaction.guildId!,
                    channelId: interaction.channelId!,
                    type: type
                },
                include: [{
                    model: client.database.AnnouncementEmbed,
                    as: 'embed',
                }]
            })

            if (isCreated)
                return await this._askForCreation(client, interaction, channel, type)
            return await this._setResponse(client, interaction, channel, type)
        } catch (error: any) {
            logger.log(client, error, 'error')
            client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
            return interaction.editReply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
            })
        }
    }

    private async _askForCreation(client: Bot, interaction: ChatInputCommandInteraction, channel: Model<TAnnouncementChannel, any>, type: AnnouncementType): Promise<void> {
        const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continuer').setStyle(ButtonStyle.Secondary).setEmoji('✅')
        const stopButton = new ButtonBuilder().setCustomId('stop').setLabel('Annuler').setStyle(ButtonStyle.Secondary).setEmoji('❌')
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton, stopButton)
        const response = await interaction.editReply({
            content: `Aucun message ${responseByType[channel.get().type]} n'est configuré sur ce serveur. Voulez-vous continuer ?`,
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
                client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))

                try { await channel.destroy() }
                catch (error: any) { logger.log(client, error, 'warn') }

                client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                return response.edit({
                    content: 'Vous avez annulé l\'opération.',
                    components: []
                })
            }
            if (button.length && button[0].customId === 'continue')
                return this._setResponse(client, interaction, channel, type, response)
        })
    }

    private async _setResponse(client: Bot, interaction: ChatInputCommandInteraction, channel: Model<TAnnouncementChannel, any>, type: AnnouncementType, response?: Message): Promise<void> {
        const rows = this._createButtons(channel.get(), type)
        const embed = await this._buildEmbed(channel.get(), interaction.member as GuildMember)
        const imageUrl = channel.get().imageUrl

        if (response) {
            await response.edit({
                content: 'No message set',
                embeds: embed,
                components: [rows[0], rows[1], rows[5]],
                files: []
            })
            return this._handleUserActions(client, interaction, channel, rows, response)
        } else {
            const response = await interaction.editReply({
                content: this._replaceTags(channel.get().message || 'No message set', interaction.member as GuildMember),
                embeds: this._replaceTags(embed, interaction.member as GuildMember),
                components: [rows[0], rows[1], rows[5]],
                files: imageUrl && imageUrl !== '' ? [imageUrl] : []
            })
            return this._handleUserActions(client, interaction, channel, rows, response)
        }
    }

    private async _buildEmbed(channel: TAnnouncementChannel, member: GuildMember): Promise<EmbedBuilder[]> {
        if (!channel.embedEnabled)
            return []

        const embed = new EmbedBuilder()
        const storedEmbed: TAnnouncementEmbed = channel.embed ? channel.embed : {
            id: 0,
            title: 'Announcement',
            color: 'Red',
            displayBody: false,
            body: null,
            displayImage: false,
            imageUrl: null,
            displayFooter: false,
            footer: null,
            displayThumbnail: false,
            thumbnailUrl: null,
            displayTimestamp: false,
            announcementChannelId: channel.id,
            fields: [],
            announcementChannel: channel
        }

        channel.embed = storedEmbed
        embed.setTitle(storedEmbed.title)
        embed.setColor(storedEmbed.color)
        if (storedEmbed.displayBody && storedEmbed.body)
            embed.setDescription(storedEmbed.body)
        if (storedEmbed.displayImage && storedEmbed.imageUrl)
            embed.setImage(storedEmbed.imageUrl)
        if (storedEmbed.displayFooter && storedEmbed.footer)
            embed.setFooter({ text: storedEmbed.footer })
        if (storedEmbed.displayThumbnail)
            embed.setThumbnail(member.user.displayAvatarURL())
        if (storedEmbed.displayTimestamp)
            embed.setTimestamp()
        return [embed]
    }

    private async _handleUserActions(client: Bot, interaction: ChatInputCommandInteraction, channel: Model<TAnnouncementChannel, any>, rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[], response: Message): Promise<void> {
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 1000 * 60 * 15,
            idle: 1000 * 60 * 5
        })
        let currentRowId = 0

        collector.on('collect', async (collectedInteraction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction) => {
            if (collectedInteraction.customId !== 'msgimg' && collectedInteraction.customId !== 'embedinfos' && collectedInteraction.customId !== 'addembedfield')
                await collectedInteraction.deferUpdate()

            const collectedInteractionChannel = collectedInteraction.channel
            const handlers: { [key: string]: () => Promise<void | Message | InteractionResponse> } = {
                'continue': () => {
                    currentRowId += 2
                    rows[5].components[0].setDisabled(false)
                    if (currentRowId === 4) {
                        rows[5].components[1].setDisabled(true)
                        return response.edit({ components: [rows[currentRowId], rows[5]] })
                    }
                    return response.edit({ components: [rows[currentRowId], rows[currentRowId + 1], rows[5]] })
                },
                'back': () => {
                    currentRowId -= 2
                    rows[5].components[1].setDisabled(false)
                    if (!currentRowId)
                        rows[5].components[0].setDisabled(true)
                    return response.edit({ components: [rows[currentRowId], rows[currentRowId + 1], rows[5]] })
                },
                'cancel': async () => {collector.stop()
                    if (collectedInteractionChannel?.isSendable())
                        return collectedInteractionChannel.send('Vous avez annulé l\'opération')
                },
                'register': async () => {
                    try {
                        if (channel.get().channelId !== interaction.channelId) {
                            const newChannel = client.channels.cache.get(channel.get().channelId)

                            if (newChannel && newChannel.isTextBased() && !newChannel.isDMBased()) {
                                await client.database.Channel.upsert({
                                    id: newChannel.id,
                                    name: newChannel.name
                                })
                            }
                        }
                        await channel.save()
                        if (channel.get().embedEnabled && channel.get().embed) {
                            const [embed, isCreated] = await client.database.AnnouncementEmbed.findOrCreate({
                                where: {
                                    announcementChannelId: channel.get().id
                                },
                                defaults: {
                                    color: channel.get().embed?.color,
                                    title: channel.get().embed?.title,
                                    displayBody: channel.get().embed?.displayBody,
                                    body: channel.get().embed?.body,
                                    displayImage: channel.get().embed?.displayImage,
                                    imageUrl: channel.get().embed?.imageUrl,
                                    displayFooter: channel.get().embed?.displayFooter,
                                    footer: channel.get().embed?.footer,
                                    displayThumbnail: channel.get().embed?.displayThumbnail,
                                    displayTimestamp: channel.get().embed?.displayTimestamp
                                }
                            })

                            if (!isCreated) {
                                embed.update({
                                    color: channel.get().embed?.color,
                                    title: channel.get().embed?.title,
                                    displayBody: channel.get().embed?.displayBody,
                                    body: channel.get().embed?.body,
                                    displayImage: channel.get().embed?.displayImage,
                                    imageUrl: channel.get().embed?.imageUrl,
                                    displayFooter: channel.get().embed?.displayFooter,
                                    footer: channel.get().embed?.footer,
                                    displayThumbnail: channel.get().embed?.displayThumbnail,
                                    displayTimestamp: channel.get().embed?.displayTimestamp
                                })
                            }
                        }
                        if (collectedInteractionChannel?.isSendable())
                            await collectedInteractionChannel.send('Tous vos changements ont été enregistrés avec succès.')
                    } catch (error: any) {
                        logger.log(client, error, 'error')
                        await interaction.followUp({
                            content: 'Une erreur est survenue lors de la création du salon, si l\'erreur se répète veuillez contacter le développeur.',
                            ephemeral: true
                        })
                    }
                    await response.edit({ components: [] })
                    return collector.stop()
                },
                'default': async () => {
                    if (collectedInteraction.customId !== 'msgimg' && collectedInteraction.customId !== 'embedinfos' && collectedInteraction.customId !== 'addembedfield')
                        await response.edit({ components: [] })

                    try {
                        await this._updateAnnouncement(interaction, collectedInteraction, channel, rows)

                        const embed = await this._buildEmbed(channel.get(), interaction.member as GuildMember)
                        const imageUrl = channel.get().imageUrl

                        return response.edit({
                            content: this._replaceTags(channel.get().message || 'No message set', interaction.member as GuildMember),
                            embeds: this._replaceTags(embed, interaction.member as GuildMember),
                            components: currentRowId !== 4 ? [rows[currentRowId], rows[currentRowId + 1], rows[5]] : [rows[currentRowId], rows[5]],
                            files: imageUrl && imageUrl !== '' ? [imageUrl] : []
                        })
                    } catch (error) {
                        logger.log(client, error, 'error')
                    }
                }
            }
            await (handlers[collectedInteraction.customId] || handlers['default'])()
        })
        collector.on('end', async () => {
            client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
        })
    }

    private async _updateAnnouncement(interaction: ChatInputCommandInteraction, collectedInteraction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction, channel: Model<TAnnouncementChannel, any>, rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[]): Promise<void | Message | InteractionResponse> {
        const handlers: { [key: string]: () => Promise<void | Message | InteractionResponse> } = {
            'isactivated': async () => {
                const activatedButton = rows[0].components[0] as ButtonBuilder
                const continueButton = rows[5].components[1] as ButtonBuilder

                channel.set({ isActivated: !channel.get().isActivated })
                activatedButton.setLabel(channel.get().isActivated ? 'Activé' : 'Désactivé').setStyle(channel.get().isActivated ? ButtonStyle.Success : ButtonStyle.Danger)
                continueButton.setDisabled(!channel.get().isActivated)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'msgimg': async () => {
                const modal = new ModalBuilder().setCustomId('modal').setTitle('Modal')
                const messageModal = new TextInputBuilder().setCustomId('message').setLabel('Message').setMaxLength(1950).setStyle(TextInputStyle.Paragraph).setValue(channel.get().message || '').setRequired(false)
                const imageUrlModal = new TextInputBuilder().setCustomId('imageurl').setLabel('Image: https://i.imgur.com/5wukV1P.jpeg').setMaxLength(255).setStyle(TextInputStyle.Short).setValue(channel.get().imageUrl || '').setRequired(false)
                const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageModal)
                const imageUrlRow = new ActionRowBuilder<TextInputBuilder>().addComponents(imageUrlModal)

                modal.addComponents(messageRow, imageUrlRow)
                await collectedInteraction.showModal(modal)

                try {
                    const collector = await interaction.awaitModalSubmit({
                        filter: i => i.user.id === interaction.user.id,
                        time: 1000 * 60 * 10,
                        idle: 1000 * 60 * 5
                    })
                    const message = collector.fields.getTextInputValue('message')
                    const imageUrl = collector.fields.getTextInputValue('imageurl')

                    channel.set({
                        message: message,
                        imageUrl: imageUrl
                    })
                    return collector.reply({
                        content: '✅',
                        ephemeral: true
                    })
                } catch { }
            },
            'isdms': async () => {
                const dmButton = rows[0].components[2] as ButtonBuilder
                const channelSelector = rows[1].components[0] as ChannelSelectMenuBuilder

                channel.set({ dm: !channel.get().dm })
                dmButton.setLabel(channel.get().dm ? 'En dms' : 'Sur le serveur')
                channelSelector.setDisabled(channel.get().dm)
                return collectedInteraction.followUp({
                    content: '✅',
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
                        content: `Veuillez spécifier un salon où envoyer les messages ${responseByType[channel.get().type]}.`,
                        ephemeral: true
                    })
                }
                channelSelectMenu.setDefaultChannels(channels)
                channel.set({ channelId: channels[0] })
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'embedenabled': async () => {
                const embedEnabledButton = rows[2].components[0] as ButtonBuilder

                channel.set({ embedEnabled: !channel.get().embedEnabled })
                embedEnabledButton.setLabel(channel.get().embedEnabled ? 'Embed activé' : 'Embed désactivé').setStyle(channel.get().embedEnabled ? ButtonStyle.Success : ButtonStyle.Danger)
                for (let i = 1; i < 3; i++)
                    rows[2].components[i].setDisabled(!channel.get().embedEnabled)
                for (let i = 0; i < 3; i++)
                    rows[3].components[i].setDisabled(!channel.get().embedEnabled)
                rows[4].components[0].setDisabled(!channel.get().embedEnabled)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'hasbody': async () => {
                const hasBodyButton = rows[2].components[1] as ButtonBuilder
                const embed = channel.get().embed

                if (!isTruthy(embed))
                    return
                embed.displayBody = !embed.displayBody
                channel.set({ embed })
                hasBodyButton.setLabel(embed.displayBody ? 'Avec description' : 'Sans description').setStyle(embed.displayBody ? ButtonStyle.Success : ButtonStyle.Danger)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'hasimage': async () => {
                const hasImageButton = rows[2].components[2] as ButtonBuilder
                const embed = channel.get().embed

                if (!isTruthy(embed))
                    return
                embed.displayImage = !embed.displayImage
                channel.set({ embed })
                hasImageButton.setLabel(embed.displayImage ? 'Avec image' : 'Sans image').setStyle(embed.displayImage ? ButtonStyle.Success : ButtonStyle.Danger)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'hasthumbnail': async () => {
                const hasThumbnailButton = rows[3].components[0] as ButtonBuilder
                const embed = channel.get().embed

                if (!isTruthy(embed))
                    return
                embed.displayThumbnail = !embed.displayThumbnail
                channel.set({ embed })
                hasThumbnailButton.setLabel(embed.displayThumbnail ? 'Avec thumbnail' : 'Sans thumbnail').setStyle(embed.displayThumbnail ? ButtonStyle.Success : ButtonStyle.Danger)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'hasfooter': async () => {
                const hasFooterButton = rows[3].components[1] as ButtonBuilder
                const embed = channel.get().embed

                if (!isTruthy(embed))
                    return
                embed.displayFooter = !embed.displayFooter
                channel.set({ embed })
                hasFooterButton.setLabel(embed.displayFooter ? 'Avec footer' : 'Sans footer').setStyle(embed.displayFooter ? ButtonStyle.Success : ButtonStyle.Danger)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'hastimestamp': async () => {
                const hasTimestampButton = rows[3].components[2] as ButtonBuilder
                const embed = channel.get().embed

                if (!isTruthy(embed))
                    return
                embed.displayTimestamp = !embed.displayTimestamp
                channel.set({ embed })
                hasTimestampButton.setLabel(embed.displayTimestamp ? 'Avec timestamp' : 'Sans timestamp').setStyle(embed.displayTimestamp ? ButtonStyle.Success : ButtonStyle.Danger)
                return collectedInteraction.followUp({
                    content: '✅',
                    ephemeral: true
                })
            },
            'embedinfos': async () => {
                const embed = channel.get().embed
                if (!isTruthy(embed))
                    return

                const modal = new ModalBuilder().setCustomId('modal').setTitle('Modal')
                const titleModal = new TextInputBuilder().setCustomId('title').setLabel('Titre').setMaxLength(255).setStyle(TextInputStyle.Short).setValue(embed.title).setRequired(true)
                const bodyModal = new TextInputBuilder().setCustomId('body').setLabel('Description').setMaxLength(2048).setStyle(TextInputStyle.Paragraph).setValue(embed.body || '').setRequired(false)
                const colorModal = new TextInputBuilder().setCustomId('color').setLabel('Couleur').setMaxLength(255).setStyle(TextInputStyle.Short).setValue(embed.color as string).setRequired(true)
                const footerModal = new TextInputBuilder().setCustomId('footer').setLabel('Footer').setMaxLength(255).setStyle(TextInputStyle.Short).setValue(embed.footer || '').setRequired(false)
                const imageUrlModal = new TextInputBuilder().setCustomId('imageurl').setLabel('Image URL').setMaxLength(255).setStyle(TextInputStyle.Short).setValue(embed.imageUrl || '').setRequired(false)
                const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleModal)
                const bodyRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bodyModal)
                const colorRow = new ActionRowBuilder<TextInputBuilder>().addComponents(colorModal)
                const footerRow = new ActionRowBuilder<TextInputBuilder>().addComponents(footerModal)
                const imageUrlRow = new ActionRowBuilder<TextInputBuilder>().addComponents(imageUrlModal)

                modal.addComponents(titleRow, bodyRow, colorRow, footerRow, imageUrlRow)
                await collectedInteraction.showModal(modal)

                try {
                    const collector = await interaction.awaitModalSubmit({
                        filter: i => i.user.id === interaction.user.id,
                        time: 1000 * 60 * 10,
                        idle: 1000 * 60 * 5
                    })
                    const title = collector.fields.getTextInputValue('title')
                    const body = collector.fields.getTextInputValue('body')
                    const color = collector.fields.getTextInputValue('color') as ColorResolvable
                    const footer = collector.fields.getTextInputValue('footer')
                    const imageUrl = collector.fields.getTextInputValue('imageurl')

                    try {
                        resolveColor(color)
                        embed.title = title
                        embed.body = body
                        embed.footer = footer
                        embed.color = color
                        embed.imageUrl = imageUrl
                        return collector.reply({
                            content: '✅',
                            ephemeral: true
                        })
                    } catch {
                        embed.title = title
                        embed.body = body
                        embed.footer = footer
                        embed.imageUrl = imageUrl
                        return collector.reply({
                            content: 'Couleur non valide.',
                            ephemeral: true
                        })
                    }
                } catch { }
            },
            'tagsinfos': async () => {
                return collectedInteraction.followUp({
                    content: '**Liste des tags disponibles:**\n>>> `-` {user}\n`-` {username}\n`-` {server}\n`-` {membercount}',
                    ephemeral: true
                })
            }
        }
        return handlers[collectedInteraction.customId]()
    }

    private _createButtons(channel: TAnnouncementChannel, type: AnnouncementType): ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder>[] = []

        const isActivatedButton = new ButtonBuilder().setCustomId('isactivated').setLabel(channel.isActivated ? 'Activé' : 'Désactivé').setStyle(channel.isActivated ? ButtonStyle.Success : ButtonStyle.Danger)
        const messageAndImageModalButton = new ButtonBuilder().setCustomId('msgimg').setLabel('Message & Image').setStyle(ButtonStyle.Secondary).setDisabled(!channel.isActivated)
        const isDmsButton = new ButtonBuilder().setCustomId('isdms').setLabel(channel.dm ? 'En dms' : 'Sur le serveur').setStyle(ButtonStyle.Secondary).setDisabled(type !== 'welcome' || !channel.isActivated)
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(isActivatedButton, messageAndImageModalButton, isDmsButton))
        const channelSelectMenu = new ChannelSelectMenuBuilder().setCustomId('channel').setMinValues(1).setMaxValues(1).setDefaultChannels(channel.channelId).setChannelTypes(ChannelType.GuildText).setDisabled(!channel.isActivated || channel.dm)
        rows.push(new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelectMenu))

        const embedEnabledButton = new ButtonBuilder().setCustomId('embedenabled').setLabel(channel.embedEnabled ? 'Embed activé' : 'Embed désactivé').setStyle(channel.embedEnabled ? ButtonStyle.Success : ButtonStyle.Danger)
        const hasBodyButton = new ButtonBuilder().setCustomId('hasbody').setLabel(channel.embed?.displayBody ? 'Avec description' : 'Sans description').setStyle(channel.embed?.displayBody ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!channel.embedEnabled)
        const hasImageButton = new ButtonBuilder().setCustomId('hasimage').setLabel(channel.embed?.displayImage ? 'Avec image' : 'Sans image').setStyle(channel.embed?.displayImage ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!channel.embedEnabled)
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(embedEnabledButton, hasBodyButton, hasImageButton))
        const hasThumbnailButton = new ButtonBuilder().setCustomId('hasthumbnail').setLabel(channel.embed?.displayThumbnail ? 'Avec thumbnail' : 'Sans thumbnail').setStyle(channel.embed?.displayThumbnail ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!channel.embedEnabled)
        const hasFooterButton = new ButtonBuilder().setCustomId('hasfooter').setLabel(channel.embed?.displayFooter ? 'Avec footer' : 'Sans footer').setStyle(channel.embed?.displayFooter ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!channel.embedEnabled)
        const hasTimestampsButton = new ButtonBuilder().setCustomId('hastimestamp').setLabel(channel.embed?.displayTimestamp ? 'Avec timestamp' : 'Sans timestamp').setStyle(channel.embed?.displayTimestamp ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!channel.embedEnabled)
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(hasThumbnailButton, hasFooterButton, hasTimestampsButton))

        const embedInfosModalButton = new ButtonBuilder().setCustomId('embedinfos').setLabel('Embed').setStyle(ButtonStyle.Secondary).setDisabled(!channel.embedEnabled)
        const tagsInfosButton = new ButtonBuilder().setCustomId('tagsinfos').setLabel('Tags').setStyle(ButtonStyle.Primary)
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(embedInfosModalButton, tagsInfosButton))

        const backButton = new ButtonBuilder().setCustomId('back').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(true)
        const continueButton = new ButtonBuilder().setCustomId('continue').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(!channel.isActivated)
        const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Annuler').setStyle(ButtonStyle.Danger)
        const registerButton = new ButtonBuilder().setCustomId('register').setLabel('Enregistrer').setStyle(ButtonStyle.Success)
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, continueButton, cancelButton, registerButton))

        return rows
    }

    private _replaceTags<T>(param: string | EmbedBuilder[], member: GuildMember): T {
        const tagsWithReplacements: { name: string, value: string }[] = [
            { name: '{user}', value: `${member.user}` },
            { name: '{username}', value: `${member.user.username}` },
            { name: '{server}', value: `${member.guild.name}` },
            { name: '{membercount}', value: `${member.guild.memberCount}` },
        ]

        if (isString(param)) {
            let result = param as string
            for (const {name, value} of tagsWithReplacements) {
                result = result.replaceAll(name, value)
            }
            return result as T
        }

        if (!param.length)
            return param as T
        for (const {name, value} of tagsWithReplacements) {
            param[0].data.title = param[0].data.title?.replaceAll(name, value)
            param[0].data.description = param[0].data.description?.replaceAll(name, value)
            if (param[0].data.footer)
                param[0].data.footer.text = param[0].data.footer.text.replaceAll(name, value)
        }
        return param as T
    }

    private async _removeAnnouncement(client: Bot, interaction: ChatInputCommandInteraction, type: AnnouncementType): Promise<void | InteractionResponse> {
        client.set.add(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))

        const t = await client.database.database.transaction()

        try {
            const announcementChannel = (await client.database.AnnouncementChannel.findOne({
                where: {
                    serverId: interaction.guildId!,
                    type: type
                },
                transaction: t
            }))
            if (!announcementChannel) {
                client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                await t.rollback()
                return interaction.reply(`Aucun salon ${responseByType[type]} n'est configuré sur ce serveur.`)
            }

            const deleteButton = new ButtonBuilder().setCustomId('delete').setLabel('Supprimer').setStyle(ButtonStyle.Danger)
            const goBackButton = new ButtonBuilder().setCustomId('goback').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton, deleteButton)
            const response = await interaction.reply({
                content: `Êtes vous sûr de ne plus vouloir recevoir de messages ${responseByType[type]} ? Cette action est irréversible.`,
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
                if (!button.length || button[0].customId === 'goback') {
                    client.set.delete(JSON.stringify({ command: interaction.commandName, guildId: interaction.guildId }))
                    await t.commit()
                    return response.edit({
                        content: 'Vous avez annulé l\'opération.',
                        components: []
                    })
                }
                if (button.length && button[0].customId === 'delete') {
                    await announcementChannel.destroy({ transaction: t })
                    await response.edit({
                        content: `Vous ne recevrez plus de messages ${responseByType[type]} sur ce serveur.`,
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

    private async _testAnnouncement(client: Bot, interaction: ChatInputCommandInteraction, type: AnnouncementType): Promise<InteractionResponse> {
        if (type === 'ban')
            client.emit('guildBanAdd', interaction.member as GuildMember)
        if (type === 'leave')
            client.emit('guildMemberRemove', interaction.member as GuildMember)
        if (type === 'welcome')
            client.emit('guildMemberAdd', interaction.member as GuildMember)

        return interaction.reply({
            content: '✅',
            ephemeral: true
        })
    }
}