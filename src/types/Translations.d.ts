export default interface Translations {
    error: {
        maintenance: string
        noPermissions: string
    }
    commands: {
        embedExecuted: string
        execError: string
        fun: {
            ratio: {
                description: string
                noArgs: string
                wantToRatio: string
                oneVote: string
            }
        }
        moderation: {

        }
        utils: {
            avatar: {
                description: string
                noUser: string
                localPfp: string
                globalPfp: string
            }
            banner: {
                description: string
                noUser: string
                noBanner: string
                globalBanner: string
                bannerColor: string
            }
            botinfos: {
                description: string
                botInfos: string
                uptime: string
                startDate: string
                createDate: string
                ramUsage: {
                    name: string
                    value: string
                }
                totalServers: string
                totalUsers: string
            }
            help: {
                description: string
                commandNotFound: string
                commandName: string
                noPermissions: string
                commandsList: string
                availableCommandsList: string
            }
            lang: {
                description: string
                answer: string
                codeNotFound: string
            }
            ping: {
                description: string
                success: string
                latency: string
            }
            prefix: {
                description: string
                prefixChanged: string
                getPrefix: string
            }
        }
    }
    interactions: {
        embedExecuted: string
        execError: string
        fun: {

        }
        moderation: {

        }
        utils: {
            help: {
                description: string
                interactionNotFound: string
                interactionName: string
                noPermissions: string
                interactionsList: string
                availableInteractionsList: string
                options: {
                    optional: string
                    required: string
                    noOptions: string
                }
            },
            urlshorten: {
                description: string
                invalidUrl: string
                shortenedUrl: string
            }
        }
    }
}
