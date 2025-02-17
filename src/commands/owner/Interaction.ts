import { Message, MessageReaction } from 'discord.js'
import { TFunction } from 'i18next'

import Bot from '@src/classes/Bot.js'
import Logger from '@src/classes/Logger.js'
import { CommandModule } from '@src/classes/ModuleImports.js'
import { CommandDecorator } from '@src/utils/Decorators.js'

const logger = Logger.getInstance('')

@CommandDecorator({
    name: 'interaction',
    description: 'Enable or disable interactions.',
    cooldown: 3,
    permissions: [],
    category: 'owner',
    usage: 'interaction <name> <action>',
    aliases: ['int']
})
export default class InteractionCommand extends CommandModule {
    public async execute(client: Bot, t: TFunction, command: Message, args: string[]): Promise<void | Message | MessageReaction> {
        try {
            if (args.length < 2)
                return command.react('❌')

            const interactionName = args[0]
            const action = args[1]
            if (!client.modules.interactions.has(interactionName))
                return command.react('❌')
            if (action !== '0' && action !== '1')
                return command.react('❌')

            await client.database.Interaction.update(
                { enabled: action === '1'},
                { where: { name: interactionName } }
            )
            return command.react('✅')
        } catch (error: any) {
            logger.log(client, error, 'error')
            return command.react('❌')
        }
    }
}