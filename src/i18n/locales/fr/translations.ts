import Resources from '@src/types/resources'

const translations: Resources = {
    error: {
        'maintenance': '{{botName}} n\'est pas disponible pour le moment'
    },
    commands: {
        fun: {
            ratio: {
                description: 'Parce que c\'est fun de ratio quelqu\'un.',
                noArgs: 'Pas capable de mentionner quelqu\'un ?',
                wantToRatio: '{{user}} veut ratio {{userToRatio}}.\nVous avez une minute pour savoir si c\'est mérité.',
                oneVote: 'Essaie pas de voter deux fois coquin.'
            }
        },
        moderation: {},
        utils: {
            avatar: {
                description: 'Affiche la photo de profil du membre sélectionné.',
                noUser: 'L\'utilisateur sélectionné n\'existe pas.',
                localPfp: 'Photos de profil [locale]({{localUrl}}) et [globale]({{globalUrl}}) de {{user}}:',
                globalPfp: 'Photo de profil [globale]({{globalUrl}}) de {{user}}:'
            },
            banner: {
                description: 'Affiche la bannière du membre sélectionné.',
                noUser: 'L\'utilisateur sélectionné n\'existe pas.',
                noBanner: '{{user}} n\'a pas de bannière.',
                globalBanner: '[Bannière]({{bannerUrl}}) de {{user}}:',
                bannerColor: 'La bannière de {{user}} est {{color}}.'
            },
            botinfos: {
                description: 'Affiche diverses informations à propos de {{bot}}.',
                botInfos: 'Informations sur {{bot}}',
                uptime: {
                    value: 'Mise en ligne {{time}}.'
                },
                startDate: {
                    name: 'Date de démarrage',
                },
                createDate: {
                    name: 'Date de création',
                },
                ramUsage: {
                    name: 'Utilisation de la RAM',
                    value: '{{bot}} utilise actuellement {{ramUsage}}MB de RAM.'
                },
                totalServers: {
                    name: 'Serveurs',
                },
                totalUsers: {
                    name: 'Utilisateurs',
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
        embedExecuted: 'Commande exécutée par {{username}} | {{botUsername}} V{{version}}',
        execError: 'Une erreur est survenue lors de l\'exécution de la commande.',
    }
}

export default translations