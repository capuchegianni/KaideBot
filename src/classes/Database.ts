import { EmbedBuilder, Message, Interaction, Client } from 'discord.js'
import { config } from 'dotenv'
import { TServer } from '../types/Server'
import { getSafeEnv, isChannel, isServer, isServers } from '../utils/TypeGuards.js'
import { Logger } from './Logger.js'
import { DataTypes, Model, ModelStatic, Op, Sequelize } from 'sequelize'
import { TAnnouncementChannel, TChannel } from '../types/Channel'
import { TUser } from '../types/User'
import { TAnnouncementEmbed, TEmbedField } from '../types/Embed'
import { TInteraction } from '../types/Interaction'
import { TCommand } from '../types/Command'
import { TTwitch } from '../types/Twitch'
import { TBot } from '../types/Bot'

config()
const logger: Logger = Logger.getInstance(
    getSafeEnv(process.env.LOG_CHANNEL_ID, 'LOG_CHANNEL_ID'),
    getSafeEnv(process.env.HIDE_LOGS, 'HIDE_LOGS') === 'true'
)

export default class Database {
    private _sequelize: Sequelize

    public User!: ModelStatic<Model<TUser, any>>
    public Server!: ModelStatic<Model<TServer, any>>
    public Channel!: ModelStatic<Model<TChannel, any>>
    public AnnouncementChannel!: ModelStatic<Model<TAnnouncementChannel, any>>
    public AnnouncementEmbed!: ModelStatic<Model<TAnnouncementEmbed, any>>
    public EmbedField!: ModelStatic<Model<TEmbedField, any>>
    public Interaction!: ModelStatic<Model<TInteraction, any>>
    public Command!: ModelStatic<Model<TCommand, any>>
    public TwitchNotification!: ModelStatic<Model<TTwitch, any>>
    public Bot!: ModelStatic<Model<TBot, any>>

    constructor() {
        this._sequelize = new Sequelize(
            getSafeEnv(process.env.DATABASE_URL, 'DATABASE_URL'), {
                define: {
                    freezeTableName: true,
                    timestamps: true,
                    createdAt: 'createdAt',
                    updatedAt: 'updatedAt',
                    deletedAt: 'deletedAt',
                    paranoid: false
                },
                logging: false
            }
        )
        this.initDatabaseInstances()
        this.setAssociations()
    }

    public async connectToDatabase(client: Client): Promise<void> {
        try {
            await this._sequelize.authenticate()

            logger.simpleLog('Connected to the database!')
            logger.logDiscordEmbed(client, new EmbedBuilder()
                .setTitle('Successfully connected to the database.')
                .setColor(`#5FC1F9`)
                .setTimestamp()
            )
        } catch (error) {
            logger.simpleError(Error(`An error occured while connecting to the database: ${error}`))
            logger.logDiscordEmbed(client, new EmbedBuilder()
                .setTitle('An error occured while connecting to the database.')
                .setDescription(`\`\`\`js\n${error}\n\`\`\``)
                .setColor(`#ff0000`)
                .setTimestamp()
            )
        }
    }

    public async disconnectFromDatabase(): Promise<void> {
        process.on('SIGINT', async () => {
            try {
                logger.simpleLog('Shutting down...')
                await this._sequelize.close()
                logger.simpleLog('Disconnected from the database.')
            } catch (error) {
                logger.simpleError(Error(`An error occured while disconnecting from the database: ${error}`))
            }
            process.exit(0)
        })
    }

    public async syncDatabase() {
        try {
            if (getSafeEnv(process.env.NODE_ENV, 'NODE_ENV') === 'development')
                await this._sequelize.sync({ alter: true, force: false })
            logger.simpleLog('Successfully synced to the database.')
        } catch (error: any) {
            logger.simpleError(error)
        }
    }

    public async initDatabaseInstances(): Promise<void> {
        this.User = this._sequelize.define('User', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            jokes: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            banned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            lang: {
                type: DataTypes.STRING(2),
                defaultValue: 'en'
            }
        })

        this.Server = this._sequelize.define('Server', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            prefix: {
                type: DataTypes.STRING(5),
                defaultValue: 'k!'
            },
            jokes: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            welcomeChannelId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            leaveChannelId: {
                type: DataTypes.STRING,
                allowNull: true
            }
        })

        this.Channel = this._sequelize.define('Channel', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            jokes: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        })

        this.AnnouncementChannel = this._sequelize.define('AnnouncementChannel', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            message: {
                type: DataTypes.STRING(1900),
                allowNull: true
            },
            dm: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            isActivated: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            embedEnabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true
            }
        }, {
            timestamps: false
        })

        this.AnnouncementEmbed = this._sequelize.define('AnnouncementEmbed', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            color: {
                type: DataTypes.STRING,
                defaultValue: 'red'
            },
            displayTitle: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            title: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            displayBody: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            body: {
                type: DataTypes.STRING(2048),
                allowNull: true
            },
            displayImage: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },
            displayFooter: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            footer: {
                type: DataTypes.STRING(2048),
                allowNull: true
            },
            displayThumbnail: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            thumbnailUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },
            displayTimestamp: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            timestamps: false
        })

        this.EmbedField = this._sequelize.define('EmbedField', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            title: {
                type: DataTypes.STRING(256),
                unique: true,
                allowNull: false
            },
            value: {
                type: DataTypes.STRING(1024),
                allowNull: true
            },
            inline: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            timestamps: false
        })

        this.Interaction = this._sequelize.define('Interaction', {
            name: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        })

        this.Command = this._sequelize.define('Command', {
            name: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        })

        this.TwitchNotification = this._sequelize.define('TwitchNotification', {
            serverId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            streamer: {
                type: DataTypes.STRING,
                allowNull: false
            },
            channelId: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },
            roleId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            message: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            updateMessage: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            isStreaming: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            title: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            game: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        }, {
            timestamps: false
        })

        this.Bot = this._sequelize.define('Bot', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            startedAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            maintenance: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        })
    }

    public setAssociations() {
        // Server associations
        this.Server.hasOne(this.Channel, { as: 'welcomeChannel', foreignKey: 'welcomeChannelId' })
        this.Server.hasOne(this.Channel, { as: 'leaveChannel', foreignKey: 'leaveChannelId' })
        this.Server.hasMany(this.Channel, { as: 'channels', foreignKey: 'serverId' })
        this.Server.hasOne(this.TwitchNotification, { as: 'twitchNotificationChannel', foreignKey: 'serverId' })

        // Channel associations
        this.Channel.belongsTo(this.Server, { as: 'server', foreignKey: 'serverId' })
        this.Channel.belongsTo(this.Server, { as: 'welcomeChannel', foreignKey: 'welcomeChannelId', targetKey: 'id' })
        this.Channel.belongsTo(this.Server, { as: 'leaveChannel', foreignKey: 'leaveChannelId', targetKey: 'id' })
        this.Channel.hasMany(this.AnnouncementChannel, { as: 'announcementChannel', foreignKey: 'channelId' })
        this.Channel.hasOne(this.TwitchNotification, { as: 'twitchNotification', foreignKey: 'channelId' })

        // AnnouncementChannel associations
        this.AnnouncementChannel.belongsTo(this.Channel, { as: 'channel', foreignKey: 'channelId', targetKey: 'id' })
        this.AnnouncementChannel.hasOne(this.AnnouncementEmbed, { as: 'embed', foreignKey: 'announcementChannelId' })

        // AnnouncementEmbed
        this.AnnouncementEmbed.belongsTo(this.AnnouncementChannel, { as: 'announcementChannel', foreignKey: 'announcementChannelId', targetKey: 'id' })
        this.AnnouncementEmbed.hasMany(this.EmbedField, { as: 'fields', foreignKey: 'embedId' })

        // EmbedField
        this.EmbedField.belongsTo(this.AnnouncementEmbed, { as: 'embed', foreignKey: 'embedId', targetKey: 'id' })

        // TwitchNotification
        this.TwitchNotification.belongsTo(this.Server, { as: 'server', foreignKey: 'serverId', targetKey: 'id' })
        this.TwitchNotification.belongsTo(this.Channel, { as: 'channel', foreignKey: 'channelId', targetKey: 'id' })
    }

    public async fetchServers(client: Client): Promise<void> {
        const guilds: { id: string, name: string }[] = client.guilds.cache.map((guild) => ({
            id: guild.id,
            name: guild.name
        }))
        const guildIds: string[] = guilds.map((guild) => guild.id)
        const t = await this._sequelize.transaction()

        try {
            for (const guild of guilds) {
                await this.Server.upsert(
                    {
                        id: guild.id,
                        name: guild.name
                    },
                    { transaction: t }
                )
            }
            await this.Server.destroy({
                where: {
                    id: {
                        [Op.notIn]: guildIds
                    }
                },
                transaction: t
            })
            await t.commit()
        } catch (error) {
            await t.rollback()
            logger.simpleError(Error(`An error occured while fetching servers: ${error}`))
        }
    }

    public async addUserFromInteraction(interaction: Interaction): Promise<void> {
        try {
            const user = await this.User.findByPk(interaction.user.id)
            if (user && user.get().updatedAt > new Date(Date.now() - 60 * 60 * 24 * 1000))
                return

            await this.User.upsert({
                id: interaction.user.id,
                name: interaction.user.username
            })
        } catch (error: any) {
            logger.simpleError(Error(`An error occured while adding a user from an interaction: ${error}`))
        }
    }

    public async addUserFromMessage(message: Message): Promise<void> {
        try {
            const user = await this.User.findByPk(message.author.id)
            if (user && user.get().updatedAt > new Date(Date.now() - 60 * 60 * 24 * 1000))
                return

            await this.User.upsert({
                id: message.author.id,
                name: message.author.username
            })
        } catch (error) {
            logger.simpleError(Error(`An error occured while adding a user from a message: ${error}`))
        }
    }

    public async addChannelFromMessage(message: Message): Promise<void> {
        try {
            const channel = (await this.Channel.findByPk(message.channelId))?.get()
            if (isChannel(channel) && channel.updatedAt > new Date(Date.now() - 60 * 60 * 24 * 1000))
                return
            if (!message.channel.isTextBased() || message.channel.isDMBased())
                return

            await this.Channel.upsert({
                id: message.channelId,
                name: message.channel.name,
                serverId: message.channel.guildId
            })
        } catch (error) {
            logger.simpleError(Error(`An error occured while adding a Channel from a message: ${error}`))
        }
    }

    public async addServerFromMessage(message: Message): Promise<void> {
        try {
            if (!message.guild || !message.guildId)
                return

            const server = (await this.Server.findByPk(message.guildId))?.get()
            if (isServer(server) && server.updatedAt > new Date(Date.now() - 60 * 60 * 24 * 1000))
                return

            await this.Server.upsert({
                id: message.guildId,
                name: message.guild.name
            })
        } catch (error) {
            logger.simpleError(Error(`An error occured while adding a Server from a message: ${error}`))
        }
    }

    public async getGuild(guildId: string): Promise<TServer> {
        const server = (await this.Server.findByPk(guildId))?.get()
        if (!isServer(server))
            throw Error(`Server ${guildId} not found in the db.`)

        return server
    }

    public async getGuilds(): Promise<TServer[]> {
        const servers = (await this.Server.findAll()).map(server => server.get())
        if (!isServers(servers))
            throw Error('Error when fetching servers in the db.')

        return servers
    }

    public get database(): Sequelize {
        return this._sequelize
    }
}