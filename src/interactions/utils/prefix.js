const { SlashCommandBuilder } = require('@discordjs/builders');
const { getPrefix, setPrefix } = require('../../utils/setPrefix.js');
const { interactionsIds } = require('../../../settings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Affiche le préfixe du bot')
        .addStringOption((option) => option.setName("prefix").setDescription("Le nouveau préfixe du bot")),
    stats: {
        category: 'Utilitaire',
        permissions: [],
        id: interactionsIds.prefix || 'prefix'
    },
    async execute(client, interaction) {
        try {
            const newPrefix = interaction.options.getString("prefix");
            const prefix = await getPrefix(interaction.guildId);

            if (newPrefix) {
                if (!interaction.member.permissions.has("ManageGuild")) {
                    return interaction.reply({
                        content: "Vous n'avez pas les permissions nécessaires pour modifier le préfixe !",
                        ephemeral: true
                    });
                }
                if (newPrefix.length > 3) {
                    return interaction.reply({
                        content: "Le préfixe ne peut pas dépasser 3 caractères !",
                        ephemeral: true
                    });
                }
                setPrefix(interaction.guildId, newPrefix);
                return interaction.reply(`Le préfixe de ${client.user.username} est maintenant \`${newPrefix}\``);
            }
            return interaction.reply(`Le préfixe de ${client.user.username} est : \`${prefix}\``);
        } catch (e) {
            throw new Error(e);
        }
    }
};