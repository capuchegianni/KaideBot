const {
    Events, EmbedBuilder, Collection
} = require('discord.js');
const { addUserInteraction } = require('../db/addUser.js');

const interactionLog = async (client, interaction) => {
    const embed = new EmbedBuilder()
        .setTitle("Interaction exécutée ✅")
        .setDescription(`**Auteur:** ${interaction.user} (${interaction.user.id})\n**Salon:** ${interaction.channel} (${interaction.channel.id})\n**Serveur:** ${interaction.guild} (${interaction.guild.id})\n**Interaction:** ${interaction.commandName}`)
        .setFooter({
            text: `Interaction exécutée par ${interaction.user.username} | ${client.user.username}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp()
        .setColor(`#00ff00`);

    await client.channels.cache.get("1121226924082077747").send({ embeds: [ embed ] });
};

const checkPermissions = (getInteraction, interaction) => {
    if (interaction.user.id !== process.env.OWNER_ID && getInteraction.stats.permissions[ 0 ] === "OWNER") {
        interaction.reply({
            content: "Vous n'avez pas la permission d'utiliser cette interaction !",
            ephemeral: true
        });
        return 1;
    }
    if (getInteraction.stats.permissions.length && getInteraction.stats.permissions[ 0 ] !== "OWNER") {
        for (let i = 0; getInteraction.stats.permissions[ i ]; i++) {
            if (!interaction.member.permissions.has(getInteraction.stats.permissions[ i ])) {
                interaction.reply({
                    content: `Vous n'avez pas la permission \`${getInteraction.stats.permissions[ i ]}\` requise pour utiliser cette commande !`,
                    ephemeral: true
                });
                return 1;
            }
        }
    }
};

const initInteractionsCooldowns = (client, interaction, getInteraction) => {
    const { cooldowns } = client;

    if (!cooldowns.has(getInteraction.data.name)) {
        cooldowns.set(getInteraction.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(getInteraction.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount = (getInteraction.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            interaction.reply({
                content: `Please wait, you are on a cooldown for \`${getInteraction.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                ephemeral: true
            });
            return 1;
        }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(client, interaction) {
        if (!interaction.isCommand()) {
            return;
        }
        if (!interaction.guildId) {
            return interaction.reply({ content: "Les intéractions ne sont pas disponibles en message privé !" });
        }

        const getInteraction = client.interactions.get(interaction.commandName);

        if (!getInteraction) {
            console.error(`No interaction matching ${interaction.commandName} was found.`);
            return;
        }
        await addUserInteraction(client, interaction);

        const isCd = initInteractionsCooldowns(client, interaction, getInteraction);

        if (isCd) {
            return;
        }
        try {
            const currentDate = new Date();
            const time = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
            const date = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;

            const perms = checkPermissions(getInteraction, interaction);

            if (perms) {
                return;
            }
            await getInteraction.execute(client, interaction);
            await interactionLog(client, interaction);
            console.log(`${interaction.commandName} interaction executed by ${interaction.user.username} (${interaction.user.id}) in ${interaction.guild.name} (${interaction.guild.id}) at ${date} ${time}`);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
            await interaction.reply({
                content: 'Il y a eu une erreur lors de l\'exécution de cette intéraction !',
                ephemeral: true
            });
        }
    }
};