const { EmbedBuilder } = require('discord.js');
const { version } = require('../../../package.json');

module.exports = {
    name: "botinfos",
    description: "Affiche les informations principales du bot.",
    permissions: [],
    stats: {
        category: "Informations",
        usage: "botinfos",
        alias: ['bi']
    },
    async run(client, command, args) {
        try {
            const { startTimestamp } = await client.prisma.bot.findUnique({ where: { id: process.env.CLIENT_ID } });
            const user = await command.author.fetch();
            const embed = new EmbedBuilder();

            embed.setTitle("Bot informations")
                .addFields(
                    { name: "Uptime", value: `The bot has been started <t:${new Date(startTimestamp).getTime().toString().slice(0, 10)}:R>`, inline: true },
                    { name: "Start date", value: `<t:${new Date(startTimestamp).getTime().toString().slice(0, 10)}>`, inline: true },
                    { name: "Creation date", value: `<t:${new Date(client.user.createdAt).getTime().toString().slice(0, 10)}:R>`, inline: true},
                    { name: "Ram usage", value: `L'utilisation de la RAM est actuellement de ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100}MB.` },
                    { name: "Total servers", value: `${client.guilds.cache.size}`, inline: true },
                    { name: "Total users", value: `${client.users.cache.size}`, inline: true},
                    { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
                    { name: "Bot version", value: version, inline: true },
                    { name: "Node.js version", value: process.version, inline: true}
                )
                .setImage(client.user.displayAvatarURL({ dynamic: true }))
                .setColor(user.hexAccentColor || "#000")
                .setFooter({
                    text: `Commande effectuée par ${command.author.username} | ${client.user.username} ${version}`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();
            command.reply({ embeds: [embed] });
        } catch (e) {
            throw new Error(e);
        }
    }
};