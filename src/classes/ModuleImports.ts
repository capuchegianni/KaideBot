import 'reflect-metadata'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import Fuse from 'fuse.js'

import {
    Collection,
    PermissionsString,
    SlashCommandBuilder,
    AutocompleteInteraction,
    GuildMember,
    PermissionResolvable,
    CommandInteraction,
    Message,
    User,
    Guild,
    Role,
} from 'discord.js'
import { glob } from 'glob'
import { TFunction } from 'i18next'

import { TCategory } from '@src/types/Command.js'
import {
    TDiscordEvents,
    TEventType
} from '@src/types/DiscordEvents.js'
import { getMetadata } from '@src/utils/Decorators.js'

import Bot from './Bot.js'
import Database from './Database.js'
import Logger from './Logger.js'

const logger = Logger.getInstance('')

export abstract class Module {
    public abstract name: string

    public async checkPermissions(command: CommandInteraction | Message, member: GuildMember | null, permissions: PermissionResolvable[], t: TFunction): Promise<boolean> {
        if (!member)
            return true
        for (const permission of permissions) {
            if (!member.permissions.has(permission)) {
                command.reply({
                    content: t('error.noPermissions'),
                    ephemeral: true
                })
                return false
            }
        }
        return true
    }

    public async getUserLanguage(client: Bot, userId: string): Promise<string> {
        const user = await client.database.User.findByPk(userId)

        if (!user || !user.get().lang)
            return 'fr'
        return user.get().lang
    }
}

export abstract class CommandModule extends Module {
    public name: string = ''
    public description!: string
    public cooldown!: number
    public permissions!: PermissionsString[]
    public category!: TCategory
    public usage!: string
    public aliases!: string[]

    constructor() {
        super()
        Object.keys(this).forEach(key => {
            const optionKey = key as keyof typeof this
            this[optionKey] = getMetadata(optionKey, this.constructor)
        })
    }

    public abstract execute(client: Bot, t: TFunction, ...args: any[]): Promise<any>

    public async getUserFromArg(client: Bot, arg: string | undefined): Promise<User | null> {
        if (!arg)
            return null

        const userId = arg.replace(/\D/g, '')
        try {
            if (!userId)
                throw Error()
            return await client.users.fetch(userId)
        } catch {
            const users = client.users.cache.map(cachedUser => ({
                username: cachedUser.username,
                cachedUser
            }))
            const fuse = new Fuse(users, {
                keys: ['username'],
                threshold: 0.3
            })
            const result = fuse.search(arg)
            return result.length > 0 ? result[0].item.cachedUser : null
        }
    }

    public async getMemberFromArg(server: Guild | null, arg: string | undefined): Promise<GuildMember | null> {
        if (!arg || !server)
            return null

        const userId = arg.replace(/\D/g, '')
        try {
            if (!userId)
                throw Error()
            return server.members.fetch(userId)
        } catch {
            const members = server.members.cache.map(cachedMember => ({
                username: cachedMember.user.username,
                cachedMember
            }))
            const fuse = new Fuse(members, {
                keys: ['username'],
                threshold: 0.3
            })
            const result = fuse.search(arg)
            return result.length > 0 ? result[0].item.cachedMember : null
        }
    }

    public async getServerFromArg(client: Bot, arg: string | undefined): Promise<Guild | null> {
        if (!arg)
            return null

        const serverId = arg.replace(/\D/g, '')
        try {
            if (!serverId)
                throw Error()
            return await client.guilds.fetch(serverId)
        } catch {
            return null
        }
    }

    public async getRoleFromArg(server: Guild, arg: string | undefined): Promise<Role | null> {
        if (!arg)
            return null

        const roleId = arg.replace(/\D/g, '')
        try {
            if (!roleId)
                throw Error()
            return await server.roles.fetch(roleId)
        } catch {
            const roles = server.roles.cache.map(cachedRoles => ({
                username: cachedRoles.name,
                cachedRoles
            }))
            const fuse = new Fuse(roles, {
                keys: ['username'],
                threshold: 0.3
            })
            const result = fuse.search(arg)
            return result.length > 0 ? result[0].item.cachedRoles : null
        }
    }
}

export abstract class EventModule extends Module {
    public name: TDiscordEvents = 'raw'
    public eventType!: TEventType

    constructor() {
        super()
        Object.keys(this).forEach(key => {
            const optionKey = key as keyof typeof this
            this[optionKey] = getMetadata(optionKey, this.constructor)
        })
    }

    public abstract execute(client: Bot, ...args: any[]): Promise<any>
}

export abstract class InteractionModule extends Module {
    public name: string = ''
    public description!: string
    public cooldown!: number
    public category!: TCategory
    public usage!: string
    public data!: SlashCommandBuilder

    constructor() {
        super()
        Object.keys(this).forEach(key => {
            const optionKey = key as keyof typeof this
            this[optionKey] = getMetadata(optionKey, this.constructor)
        })
    }

    public abstract execute(client: Bot, t: TFunction, ...args: any[]): Promise<any>
    public abstract autoComplete(client: Bot, interaction: AutocompleteInteraction): Promise<void>
}

export default class ModuleImports {
    private _commands: Collection<string, CommandModule> = new Collection()
    private _interactions: Collection<string, InteractionModule> = new Collection()
    private _events: Collection<string, EventModule> = new Collection()

    public async loadModules() {
        const filePath = fileURLToPath(import.meta.url)
        const srcDirPath = path.join(filePath, '..', '..', '..')
        const modulePaths = await glob(`${srcDirPath}/build/{events,commands,interactions}/**/*.{ts,js}`)

        for (const path of modulePaths) {
            const module = await import(pathToFileURL(path).href)
            if (module.default) {
                const instance: Module = new module.default()

                if (instance instanceof CommandModule)
                    this._commands.set(instance.name, instance)
                if (instance instanceof EventModule)
                    this._events.set(instance.name, instance)
                if (instance instanceof InteractionModule)
                    this._interactions.set(instance.name, instance)
            }
        }
    }

    public get commands(): Collection<string, CommandModule> {
        return this._commands
    }

    public get interactions(): Collection<string, InteractionModule> {
        return this._interactions
    }

    public get events(): Collection<string, EventModule> {
        return this._events
    }

    public eventListener(client: Bot) {
        for (const [eventName, eventModule] of this._events) {
            if (eventModule.eventType === 'once')
                client.once(eventName, (...args) => eventModule.execute(client, ...args))
            else
                client.on(eventName, (...args) => eventModule.execute(client, ...args))
        }
    }

    public async upsertInteractionsIntoDb(db: Database): Promise<void> {
        const t = await db.database.transaction()

        try {
            for (const [interactionName] of this._interactions) {
                await db.Interaction.upsert(
                    { name: interactionName },
                    { transaction: t }
                )
            }
            await t.commit()
        } catch (error: any) {
            await t.rollback()
            logger.simpleError(error)
        }
    }

    public async upsertCommandsIntoDb(db: Database): Promise<void> {
        const t = await db.database.transaction()

        try {
            for (const [commandName] of this._commands) {
                await db.Command.upsert(
                    { name: commandName },
                    { transaction: t }
                )
            }
            await t.commit()
        } catch (error: any) {
            await t.rollback()
            logger.simpleError(error)
        }
    }
}