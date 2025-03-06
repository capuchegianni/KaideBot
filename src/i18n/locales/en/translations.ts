import Translations from '@src/types/Translations'

const translations: Translations = {
    error: {
        maintenance: '{{botName}} is not available for now.',
        noPermissions: 'You don\'t have the permissions to do this action.'
    },
    commands: {
        fun: {
            ratio: {
                description: 'Because it\'s fun to ratio someone.',
                noArgs: 'Not able to mention anyone ?',
                wantToRatio: '{{user}} wants to ratio {{userToRatio}}.\nYou have one minute to know if it\'s deserved.',
                oneVote: 'Don\'t try to vote two times silly one.'
            }
        },
        moderation: { },
        utils: {
            avatar: {
                description: 'Display the profile picture of the selected member.',
                noUser: 'The selected member does not exist.',
                localPfp: '[Local]({{localUrl}}) and [global]({{globalUrl}}) profile pictures of {{user}}:',
                globalPfp: '[global]({{globalUrl}}) profile picture of {{user}}:'
            },
            banner: {
                description: 'Display the banner of the selected member.',
                noUser: 'The selected member does not exist.',
                noBanner: '{{user}} does not have a banner.',
                globalBanner: '[Banner]({{bannerUrl}}) of {{user}}:',
                bannerColor: '{{user}}\' banner color is {{color}}.'
            },
            botinfos: {
                description: 'Display misc informations about {{bot}}.',
                botInfos: '{{bot}} informations',
                uptime: '{{bot}} has been started {{time}}.',
                startDate: 'Start date',
                createDate: 'Creation date',
                ramUsage: {
                    name: 'RAM usage',
                    value: '{{bot}} currently uses {{ramUsage}}MB of RAM.'
                },
                totalServers: 'Servers',
                totalUsers: 'Users'
            },
            help: {
                description: 'Display the available commands.',
                commandNotFound: 'Command {{commandName}} does not exist.',
                commandName: 'Command {{commandName}}',
                noPermissions: 'No permission requested.',
                commandsList: 'Command list 📚',
                availableCommandsList: 'Here is the list of the available commands:\n\n{{commandList}}'
            },
            lang: {
                description: 'Return or modify the language used by the bot to answer you.',
                answer: '{{botName}} answers you in english.',
                codeNotFound: 'The specified code is not handled by {{botName}} or does not exist.'
            },
            ping: {
                description: 'Display the bot and API latency.',
                success: 'Pinged successfully 🏓',
                latency: '**Client Latency:** {{clientPing}}ms\n**API latency:** {{apiLatency}}ms'
            },
            prefix: {
                description: 'Return or modify the server prefix.',
                prefixChanged: '{{botName}} prefix is now `{{prefix}}`.',
                getPrefix: '{{botName}} prefix is `{{prefix}}`.'
            }
        },
        embedExecuted: 'Command executed by {{username}} | {{botUsername}} V{{version}}',
        execError: 'An error happenned when executing the command.',
    },
    interactions: {
        embedExecuted: 'Interaction executed by {{username}} | {{botUsername}} V{{version}}',
        execError: 'An error happenned when executing the interaction.',
        fun: { },
        moderation: { },
        utils: {
            help: {
                description: 'Display the available commands.',
                interactionNotFound: 'Interaction {{interactionName}} does not exist.',
                interactionName: 'Interaction {{interactionName}}',
                noPermissions: 'No permission requested.',
                interactionsList: 'Interaction list 📚',
                availableInteractionsList: 'Here is the list of the available interactions:\n\n{{interactionList}}',
                options: {
                    optional: 'Optional',
                    required: 'Required',
                    noOptions: 'No option available'
                }
            },
            urlshorten: {
                description: 'Create a new link pointing to the selected link.',
                invalidUrl: 'Please provide a valid url.',
                shortenedUrl: '[Here is the shortened link](https://{{shortenedUrl}}) created from {{urlToShorten}}.'
            }
        }
    }
}

export default translations