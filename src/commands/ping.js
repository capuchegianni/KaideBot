const { EmbedBuilder } = require('discord.js');
const { version } = require('../../package.json');

module.exports = {
    name: "ping",
    description: "Affiche le ping du bot",
    permissions: [],
    stats: {
        category: 'Utilitaire',
        usage: 'ping'
    },
    async run(client, command) {
        const sent = await command.reply({
            content: 'Pinging...',
            fetchReply: true
        });
        const embed = new EmbedBuilder()
            .setTitle("Pinged Successfully 🏓")
            .setDescription(`**Client Latency:** ${client.ws.ping}ms\n**API latency:** ${sent.createdTimestamp - command.createdTimestamp}ms`)
            .setFooter({
                text: `Commande effectuée par ${command.author.username} | ${client.user.username} V${version}`,
                iconURL: command.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp()
            .setColor(`#ffc800`);
        return sent.edit({
            content: "Pinged successfully !",
            embeds: [ embed ]
        });
    }
};