const { SlashCommandBuilder } = require('@discordjs/builders');
const { interactionsIds } = require('../../../settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Affiche votre photo de profil ou celle d'un membre du serveur")
        .addUserOption((option) => option.setName("membre").setDescription("La photo de profil du membre voulu")),
    stats: {
        category: "Utilitaire",
        permissions: [],
        id: interactionsIds.avatar || 'avatar'
    },
    execute(client, interaction) {
        try {
            const user = interaction.options.getUser("membre") ?? interaction.user;

            if (user) {
                return interaction.reply({
                    content: `Photo de profil de ${user}[ : ](${user.displayAvatarURL({
                        dynamic: true,
                        size: 4096
                    })})`,
                    allowedMentions: { parse: [] }
                });
            }
        } catch (e) {
            throw new Error(e);
        }
    }
};