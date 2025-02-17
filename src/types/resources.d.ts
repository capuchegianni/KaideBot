export default interface Resources {
    error: {
        'maintenance': string
    },
    commands: {
        embedExecuted: string,
        execError: string,
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
            },
            lang: {
                description: string
            },
            ping: {
                description: string
            },
            prefix: {
                description: string
            }
        }
    }
}
