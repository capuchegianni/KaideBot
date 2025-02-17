import Resources from '@src/types/resources'

const translations: Resources = {
    error: {
        'maintenance': '{{botName}} is not available for now.'
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
        moderation: {},
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
                uptime: {
                    value: '{{bot}} has been started {{time}}.'
                },
                startDate: {
                    name: 'Start date',
                },
                createDate: {
                    name: 'Creation date',
                },
                ramUsage: {
                    name: 'RAM usage',
                    value: '{{bot}} currently uses {{ramUsage}}MB of RAM.'
                },
                totalServers: {
                    name: 'Servers',
                },
                totalUsers: {
                    name: 'Users',
                }
            },
            help: {
                description: ''
            },
            lang: {
                description: ''
            },
            ping: {
                description: ''
            },
            prefix: {
                description: ''
            }
        },
        embedExecuted: 'Command executed by {{username}} | {{botUsername}} V{{version}}',
        execError: 'An error happenned when executing the command.',
    }
}

export default translations