import {
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionsBitField,
    CommandInteractionOptionResolver,
    ChannelType,
    GuildChannel,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    GuildMember,
    InteractionResponse,
    ApplicationIntegrationType,
    InteractionContextType,
} from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { InteractionModule } from '@src/classes/ModuleImports.js'
import { InteractionDecorator } from '@src/utils/Decorators.js'

const logger = Logger.getInstance('')

@InteractionDecorator({
    name: 'puns',
    description: 'Configuration et liste des jeux de mots sur votre serveur.',
    cooldown: 5,
    category: 'administration',
    usage: 'puns <configure <server | channel | user> | add | remove | list | find <byid | byname>',
    data: new SlashCommandBuilder()
        .setName('puns')
        .setDescription('Configuration et liste des jeux de mots sur votre serveur.')
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('configure')
            .setDescription('Configuration des jeux de mots.')
            .addSubcommand(subCommand => subCommand
                .setName('server')
                .setDescription('Configuration des jeux de mots sur le serveur.')
                .addBooleanOption(option => option
                    .setName('enable')
                    .setDescription('Active ou désactive les jeux de mots.')
                    .setRequired(true)
                )
            )
            .addSubcommand(subCommand => subCommand
                .setName('channel')
                .setDescription('Configuration des jeux de mots sur le salon choisi.')
                .addBooleanOption(option => option
                    .setName('enable')
                    .setDescription('Active ou désactive les jeux de mots.')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Le salon que vous voulez modifer.')
                    .addChannelTypes(ChannelType.GuildText)
                )
            )
            .addSubcommand(subCommand => subCommand
                .setName('user')
                .setDescription('Configuration des jeux de mots pour vous-même.')
                .addBooleanOption(option => option
                    .setName('enable')
                    .setDescription('Active ou désactive les jeux de mots.')
                    .setRequired(true)
                )
            )
        )
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('find')
            .setDescription('Liste les jeux de mots voulus.')
            .addSubcommand(subCommand => subCommand
                .setName('byid')
                .setDescription('Trouve le jeu de mots à l\'aide de son id dans la db.')
                .addNumberOption(option => option
                    .setName('id')
                    .setDescription('L\'id du jeu de mot.')
                    .setRequired(true)
                )
            )
            .addSubcommand(subCommand => subCommand
                .setName('byname')
                .setDescription('Trouve les jeux de mots à l\'aide de leur nom.')
                .addStringOption(option => option
                    .setName('name')
                    .setDescription('Nom des jeux de mots.')
                    .setRequired(true)
                )
            )
        )
        .addSubcommand(subCommand => subCommand
            .setName('list')
            .setDescription('Liste tous les jeux de mots du serveur.')
        )
        .addSubcommand(subCommand => subCommand
            .setName('add')
            .setDescription('Ajoute un nouveau jeu de mot au serveur.')
            .addStringOption(option => option
                .setName('tofind')
                .setDescription('Le mot que le bot doit trouver.')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('toanswer')
                .setDescription('La réponse du bot lorsque le mot a été trouvé.')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('type')
                .setDescription('Comment le mot doit être cherché dans le message.')
                .addChoices(
                    { name: 'Includes', value: 'includes' },
                    { name: 'Ends With', value: 'endsWith' },
                    { name: 'StartsWith', value: 'startsWith' }
                )
                .setRequired(true)
            )
        )
        .addSubcommandGroup(subCommandGroup => subCommandGroup
            .setName('remove')
            .setDescription('Supprime le jeu de mot voulu du serveur.')
            .addSubcommand(subCommand => subCommand
                .setName('byid')
                .setDescription('Supprime le jeu de mots à l\'aide de son id dans la db.')
                .addNumberOption(option => option
                    .setName('id')
                    .setDescription('L\'id du jeu de mot.')
                    .setRequired(true)
                )
            )
            .addSubcommand(subCommand => subCommand
                .setName('byname')
                .setDescription('Supprime les jeux de mots à l\'aide de leur nom.')
                .addStringOption(option => option
                    .setName('name')
                    .setDescription('Nom des jeux de mots.')
                    .setRequired(true)
                )
            )
        )
        .addSubcommand(subCommand => subCommand
            .setName('infos')
            .setDescription('Vous informe si les jeux de mots sont effectués dans le serveur, dans un salon et avec vous.')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Le salon dont vous voulez avoir l\'information.')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
        .setContexts([InteractionContextType.Guild])
})
export default class PunsInteraction extends InteractionModule {
    public async autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void> { }

    public async execute(client: Bot, t: TFunction, interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse> {
        const options = interaction.options as CommandInteractionOptionResolver

        switch (options.getSubcommandGroup()) {
            case 'configure':
                await this._configureServer(client, interaction, options, t)
                await this._configureChannel(client, interaction, options, t)
                await this._configureUser(client, interaction, options)
                return
            case 'find':
                await this._findById(client, interaction, options)
                await this._findByName(client, interaction, options)
                return
            case 'remove':
                await this._removeById(client, interaction, options, t)
                await this._removeByName(client, interaction, options, t)
                return
        }
        switch (options.getSubcommand()) {
            case 'add':
                return this._add(client, interaction, options, t)
            case 'list':
                return this._list(client, interaction, options)
            case 'infos':
                return this._infos(client, interaction, options)
        }
    }

    private async _configureServer(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver, t:TFunction): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'server'))
            return
        if (!(await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t)))
            return
        try {
            const toEnable = options.getBoolean('enable', true)

            await client.database.Server.update(
                { jokes: toEnable },
                { where: { id: interaction.guildId! } }
            )
            return interaction.reply(`Les jeux de mots ont été ${toEnable ? 'activés' : 'désactivés'} sur le serveur avec succès!`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _configureChannel(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver, t: TFunction): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'channel'))
            return
        if (!(await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t)))
            return
        try {
            const channel = options.getChannel('channel') || interaction.channel!
            const toEnable = options.getBoolean('enable', true)

            await client.database.Channel.update(
                { jokes: toEnable },
                { where: { id: channel.id } }
            )
            return interaction.reply(`Les jeux de mots ont été ${toEnable ? 'activés' : 'désactivés'} dans le salon ${channel} avec succès!`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _configureUser(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'user'))
            return
        try {
            const toEnable = options.getBoolean('enable', true)

            await client.database.User.update(
                { jokes: toEnable },
                { where: { id: interaction.user.id } }
            )
            return interaction.reply(`Le bot ${toEnable ? 'peut désormais' : 'ne peut plus'} vous répondre!`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _findById(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'byid'))
            return
        try {
            const id = options.getNumber('id', true)

            const pun = (await client.database.Pun.findOne({
                where: {
                    serverId: interaction.guildId!,
                    idInServer: id
                }
            }))?.get()
            if (!pun)
                return interaction.reply(`L'id \`${id}\` n'est associé à aucun jeu de mots.`)

            const embed = new EmbedBuilder()
                .addFields(
                    { name: 'Mot à trouver', value: pun.toFind },
                    { name: 'Réponses possibles', value: pun.toAnswer },
                    { name: 'Type', value: pun.type }
                )
                .setFooter({
                    text: `Intéraction effectuée par ${interaction.user.username} | ${client.user?.username} V${client.version}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(`#ffc800`)

            return interaction.reply({
                embeds: [embed]
            })
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _findByName(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'byname'))
            return
        try {
            const name = options.getString('name', true)

            const puns = (await client.database.Pun.findAll({
                where: {
                    serverId: interaction.guildId!,
                    toFind: name
                }
            }))
            if (!puns || !puns.length)
                return interaction.reply(`Le nom \`${name}\` n'est associé à aucun jeu de mots.`)

            const embed = new EmbedBuilder()
                .addFields(
                    { name: 'Mot à trouver', value: name },
                    { name: 'Réponses possibles', value: puns.map(pun => `\`'${pun.get().toAnswer}'\``).join(', ') },
                    { name: 'Type', value: puns.map(pun => `\`'${pun.get().type}'\``).join(', ') }
                )
                .setFooter({
                    text: `Intéraction effectuée par ${interaction.user.username} | ${client.user?.username} V${client.version}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(`#ffc800`)

            return interaction.reply({
                embeds: [embed]
            })
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _removeById(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver, t: TFunction): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'byid'))
            return
        if (!(await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t)))
            return
        try {
            const id = options.getNumber('id', true)
            const result = await client.database.Pun.destroy({
                where: {
                    serverId: interaction.guildId!,
                    idInServer: id
                }
            })
            if (!result)
                return interaction.reply(`L'id \`${id}\` n'est associé à aucun jeu de mots.`)

            return interaction.reply(`Le jeu de mot ${id} a été supprimé correctement.`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _removeByName(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver, t: TFunction): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'byname'))
            return
        if (!(await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t)))
            return
        try {
            const name = options.getString('name', true)
            const result = await client.database.Pun.destroy({
                where: {
                    serverId: interaction.guildId!,
                    toFind: name
                }
            })
            if (!result)
                return interaction.reply(`Le nom \`${name}\` n'est associé à aucun jeu de mots.`)

            return interaction.reply(`${result} jeux de mots réagissant à \`${name}\` ont été supprimés.`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _add(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver, t: TFunction): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'add'))
            return
        if (!(await this.checkPermissions(interaction, interaction.member as GuildMember, ['ManageGuild'], t)))
            return
        try {
            const toFind = options.getString('tofind', true).trim().toLowerCase()
            const toAnswer = options.getString('toanswer', true).trim()
            const type = options.getString('type', true)

            const highestIdInServer = await client.database.Pun.findOne({
                where: { serverId: interaction.guildId! },
                order: [['idInServer', 'DESC']],
                attributes: ['idInServer']
            })
            const newIdInServer = highestIdInServer ? highestIdInServer.get().idInServer + 1 : 1

            await client.database.Pun.create({
                toFind: toFind,
                toAnswer: toAnswer,
                type: type,
                serverId: interaction.guildId!,
                idInServer: newIdInServer
            })
            return interaction.reply(`Le jeu de mot a correctement été enregistré avec l'id ${newIdInServer}.`)
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _list(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'list'))
            return
        try {
            const {count, rows} = await client.database.Pun.findAndCountAll({
                where: { serverId: interaction.guildId! }
            })
            const embed = new EmbedBuilder()
                .setTitle(`Jeux de mots du serveur ${interaction.guild}`)
                .setFooter({
                    text: `Intéraction effectuée par ${interaction.user.username} | ${client.user?.username} V${client.version}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(`#ffc800`)
            const types = {
                includes: 'Contient',
                endsWith: 'Finit par',
                startsWith: 'Commence par'
            }

            if (!count) {
                embed.setDescription('Aucun jeu de mot créé.')
                return interaction.reply({
                    embeds: [embed]
                })
            }

            if (count > 10) {
                const left = new ButtonBuilder().setCustomId('left').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
                const right = new ButtonBuilder().setCustomId('right').setEmoji('➡️').setStyle(ButtonStyle.Secondary)
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(left, right)
                let currentPage = 0
                const maxPages = Math.ceil(count / 10) - 1

                embed.setDescription(rows.slice(0, 10).map(pun => {
                    return `${pun.get().idInServer} - ${types[pun.get().type]} \`${pun.get().toFind}\` => \`${pun.get().toAnswer}\``
                }).join('\n'))

                const response = await interaction.reply({
                    embeds: [embed],
                    components: [row]
                })
                const collector = response.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    componentType: ComponentType.Button,
                    time: 1000 * 60 * 5
                })

                collector.on('collect', async collectedInteraction => {
                    collectedInteraction.deferUpdate()

                    if (collectedInteraction.customId === 'left')
                        currentPage = currentPage === 0 ? maxPages : currentPage - 1
                    if (collectedInteraction.customId === 'right')
                        currentPage = currentPage === maxPages ? 0 : currentPage + 1

                    const startIndex = currentPage * 10
                    const endIndex = startIndex + 10
                    const currentRows = rows.slice(startIndex, endIndex)

                    embed.setDescription(currentRows.map(pun => {
                        return `${pun.get().idInServer} - ${types[pun.get().type]} \`${pun.get().toFind}\` => \`${pun.get().toAnswer}\``
                    }).join('\n'))

                    await interaction.editReply({
                        embeds: [embed],
                        components: [row]
                    })
                })
            } else {
                embed.setDescription(rows.map(pun => {
                    return `${pun.get().idInServer} - ${types[pun.get().type]} \`${pun.get().toFind}\` => \`${pun.get().toAnswer}\``
                }).join('\n'))
                return interaction.reply({
                    embeds: [embed]
                })
            }
        } catch (error: any) {
            logger.log(client, error, 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }

    private async _infos(client: Bot, interaction: ChatInputCommandInteraction, options: CommandInteractionOptionResolver): Promise<void | InteractionResponse> {
        if (!(options.getSubcommand() === 'infos'))
            return
        try {
            const channel = (options.getChannel('channel') || interaction.channel!) as GuildChannel
            const serverEnabled = (await client.database.Server.findByPk(interaction.guildId!))?.get().jokes
            const channelEnabled = (await client.database.Channel.findByPk(channel.id))?.get().jokes
            const userEnabled = (await client.database.User.findByPk(interaction.user.id))?.get().jokes
            const embed = new EmbedBuilder()
                .addFields(
                    { name: `${interaction.guild}`, value: `Jeux de mots ${serverEnabled ? 'activés' : 'désactivés'}` },
                    { name: `${channel}`, value: `Jeux de mots ${channelEnabled ? 'activés' : 'désactivés'}` },
                    { name: `${interaction.user.username}`, value: `Jeux de mots ${userEnabled ? 'activés' : 'désactivés'}` },
                )
                .setFooter({
                    text: `Intéraction effectuée par ${interaction.user.username} | ${client.user?.username} V${client.version}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(`#ffc800`)

            return interaction.reply({ embeds: [embed] })
        } catch (error: any) {
            logger.log(client, error , 'error')
            return interaction.reply({
                content: 'Une erreur est survenue lors de l\'éxécution de l\'intéraction.',
                ephemeral: true
            })
        }
    }
}