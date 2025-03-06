import Translations from '@src/types/Translations'

const translations: Translations = {
    error: {
        maintenance: '{{botName}} n\'est pas disponible pour le moment',
        noPermissions: 'Vous n\'avez pas les permissions d\'effectuer cette action.'
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
        moderation: { },
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
                uptime: 'Mise en ligne {{time}}.',
                startDate: 'Date de démarrage',
                createDate: 'Date de création',
                ramUsage: {
                    name: 'Utilisation de la RAM',
                    value: '{{bot}} utilise actuellement {{ramUsage}}MB de RAM.'
                },
                totalServers: 'Serveurs',
                totalUsers: 'Utilisateurs'
            },
            help: {
                description: 'Affiche les commandes disponibles.',
                commandNotFound: 'La commande {{commandName}} n\'existe pas.',
                commandName: 'Commande `{{commandName}}` 📚',
                noPermissions: 'Aucune permission requise.',
                commandsList: 'Liste des commandes 📚',
                availableCommandsList: 'Voici la liste des commandes disponibles:\n\n{{commandList}}'
            },
            lang: {
                description: 'Retourne ou modifie la langue utilisée par le bot pour vous répondre.',
                answer: '{{botName}} vous répond en français.',
                codeNotFound: 'Le code spécifié n\'est pas géré par {{botName}} ou il n\'existe pas.'
            },
            ping: {
                description: 'Affiche la latence du bot et de l\'API.',
                success: 'Ping réalisé avec succès 🏓',
                latency: '**Latence du bot:** {{clientPing}}ms\n**Latence de l\'API:** {{apiLatency}}ms'
            },
            prefix: {
                description: 'Retourne ou modifie le préfixe du serveur.',
                prefixChanged: 'Le préfixe de {{botName}} est désormais `{{prefix}}`.',
                getPrefix: 'Le préfixe de {{botName}} est `{{prefix}}`.'
            }
        },
        embedExecuted: 'Commande exécutée par {{username}} | {{botUsername}} V{{version}}',
        execError: 'Une erreur est survenue lors de l\'exécution de la commande.',
    },
    interactions: {
        embedExecuted: 'Intéraction exécutée par {{username}} | {{botUsername}} V{{version}}',
        execError: 'Une erreur est survenue lors de l\'exécution de l\'intéraction.',
        fun: { },
        moderation: { },
        utils: {
            help: {
                description: 'Affiche les intéractions disponibles.',
                interactionNotFound: 'La commande {{interactionName}} n\'existe pas.',
                interactionName: 'Commande `{{interactionName}}` 📚',
                noPermissions: 'Aucune permission requise.',
                interactionsList: 'Liste des intéractions 📚',
                availableInteractionsList: 'Voici la liste des intéractions disponibles:\n\n{{interactionList}}',
                options: {
                    optional: 'Optionnel',
                    required: 'Requis',
                    noOptions: 'Aucune option disponible'
                }
            },
            urlshorten: {
                description: 'Crée un lien raccourci à partir de l\'url fournie.',
                invalidUrl: 'Merci de fournir une url valide.',
                shortenedUrl: '[Voici le lien raccourci](https://{{shortenedUrl}}) créé à partir de {{urlToShorten}}.'
            }
        }
    }
}

export default translations