module.exports = async (client, message) => {
    const puns = [ [ "quoi", "feur" ], [ "oui", "stiti" ], [ "non", "bril" ], [ "a", "b" ], [ "c", "d" ], [ "e", "z ratio" ], [ "z", "Mdrrr imagine t'es allé jusqu'au bout" ], [ "si", "rène comme toi ma belle" ], [ "crois", "sant" ], [ "tg", "v" ], [ "ouais", "stern" ], [ "mais", "juin" ], [ "juillet", "août (mois goatesque souhaitez moi mon anniversaire le 20 svp)" ], [ "hein", "deux" ], [ "trois", "soleil t'as bougé au cachot" ], [ "toi", "lettes" ], [ "you", "π (pi pour les deux trois débiles du fond genre Mathis au hasard)" ], [ "fuck", "let's do it baby 😉😏" ], [ "merde", "<@492561801913827349> on t'appelle" ], [ "mince", "c'est gianni ça" ], [ "ok", "sur glace" ], [ "euh", "f" ], [ "g", "ianni hihihihi" ], [ "trop", "pico" ], [ "oh", "tarie" ], [ "gg", "bg" ], [ "chaud", "cacao" ], [ "fdp", "parle mieux ou jte baise" ], [ "ftg", "ratio" ], [ "comment", "dant" ], [ "moi", "sonneuse" ], [ "bonsoir", "Pariiis" ], [ "connard", "jte ez" ], [ "ntm", "on parle pas des mamans" ], [ "ratio", "Flop likez tous svp" ], [ "con", "je valide totalement" ] ];
    const user = await client.prisma.user.findUnique({ where: { id: message.author.id } });
    const channel = await client.prisma.channel.findUnique({ where: { id: message.channelId }});
    const server = await client.prisma.server.findUnique({ where: { id: message.guildId } });

    if (!user.jokes || !server.jokes || (channel && !channel.jokes)) {
        return;
    }

    const strArr = message.content.replace(/[.,\/#!?$%\^&\*;:{}=_`~()]/g, ' ').split(" ");
    const lastWord = strArr.reverse().find((word) => /[a-zA-Z0-9]/.test(word));

    for (let i = 0; puns[ i ]; i++) {
        if (lastWord?.toLowerCase() === puns[ i ][ 0 ]) {
            message.reply(`${puns[ i ][ 1 ]}`);
            return;
        }
    }
}