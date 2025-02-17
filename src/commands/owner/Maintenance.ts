import { Message, MessageReaction } from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

const logger = Logger.getInstance('')

@CommandDecorator({
    name: 'maintenance',
    description: 'Enable or disable maintenance state.',
    cooldown: 3,
    permissions: [],
    category: 'owner',
    usage: 'maintenance <action>',
    aliases: []
})
export default class MaintenanceCommand extends CommandModule {
    public async execute(client: Bot, t: TFunction, command: Message, args: string[]): Promise<MessageReaction> {
        if (!args.length)
            return command.react('❌')
        if (args[0] !== '0' && args[0] !== '1')
            return command.react('❌')

        try {
            await client.database.Bot.update(
                { maintenance: args[0] === '1' },
                { where: { id: client.user?.id } }
            )
            return command.react('✅')
        } catch (error: any) {
            logger.log(client, error, 'error')
            return command.react('❌')
        }
    }
}