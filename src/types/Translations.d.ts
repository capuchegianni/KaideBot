export default interface Translations {
    error: {
        'maintenance': string
    },
    commands: {
        embedExecuted: string,
        execError: string,
        noPermissions: string,
        fun: {
            ratio: {
                description: string,
                noArgs: string,
                wantToRatio: string,
                oneVote: string
            }
        },
        moderation: {

        },
        utils: {
            avatar: {
                description: string,
                noUser: string,
                localPfp: string,
                globalPfp: string
            },
            banner: {
                description: string,
                noUser: string,
                noBanner: string,
                globalBanner: string,
                bannerColor: string
            },
            botinfos: {
                description: string,
                botInfos: string,
                uptime: {
                    value: string
                },
                startDate: {
                    name: string,
                },
                createDate: {
                    name: string,
                },
                ramUsage: {
                    name: string,
                    value: string
                },
                totalServers: {
                    name: string,
                },
                totalUsers: {
                    name: string,
                }
            },
            help: {
                description: string
                commandNotFound: string
                commandName: string
                commandInfos: string
                noPermissions: string
                commandsList: string
                availableCommandsList: string
            },
            lang: {
                description: string
                answer: string
                codeNotFound: string
            },
            ping: {
                description: string
                success: string
                latency: string
            },
            prefix: {
                description: string
                prefixChanged: string
                getPrefix: string
            }
        }
    }
}
