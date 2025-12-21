const { Locale, EmbedBuilder } = require("discord.js");
const { LOG_CHANNEL } = require("../discordsettings");
const { D1Class } = require("../d1class");

const LOCALE_LOGCHANNEL_NOTFOUND = {
    [Locale.EnglishUS]: 'The log channel was not found or was removed, the bot cannot longer process any group interactions until it is configured again',
    [Locale.SpanishLATAM]: 'El canal de registros no se encontro o ha sido eliminado, el bot no procesara ningun accion de grupo hasta que se configure de nuevo',
    [Locale.SpanishES]: '¡Ostras, tío! El canal de registros ha volado o lo han mandado a tomar por saco, ¡qué movida! El bot no va a mover ni un dedo con los grupos hasta que lo apañes de nuevo, ¿vale, chaval?',
}

const LOCALE_INFO = {
    [Locale.EnglishUS]: '**Group**: {vrchat_group_id}\n**Action ID**: {action_id}',
    [Locale.SpanishLATAM]: '**Grupo**: {vrchat_group_id}\n**ID de la accion**: {action_id}',
    [Locale.SpanishES]: '**Grupo**: {vrchat_group_id}\n**ID de la accion**: {action_id}',
}

const LOCALE_ACTION_BY = {
    [Locale.EnglishUS]: 'Action made by {action_by}',
    [Locale.SpanishLATAM]: 'Accion realizada por {action_by}',
    [Locale.SpanishES]: 'Accion realizada por {action_by}',
}

/**
 * Logs a group to the database
 * @param {import("discord.js").Interaction} interaction
 * @param {string} vrchat_group_id
 * @param {string} description
 * @returns {Promise<boolean>}
 */
async function LogGroup(interaction, vrchat_group_id, description) {
    const guildId = interaction.guildId;
    const localeTarget = interaction.locale;
    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };

    const logChannelId = await D1Class.getDiscordSetting(userRequestData, guildId, LOG_CHANNEL);
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
        const { components, files } = createErrorEmbed(LOCALE_LOGCHANNEL_NOTFOUND[localeTarget]);
        await interaction.editReply({
            components,
            files,
            flags: MessageFlags.IsComponentsV2
        });
        return false;
    }

    let response = await D1Class.logVRChatGroup(userRequestData, vrchat_group_id, guildId, description);

    const embed = new EmbedBuilder()
        .setTitle(description)
        .setDescription(LOCALE_INFO[localeTarget].replace('{vrchat_group_id}', vrchat_group_id).replace('{action_id}', response.data.log_id))
        .setColor("Random")
        .setTimestamp()
        .setFooter({
            text: LOCALE_ACTION_BY[localeTarget].replace('{action_by}', interaction.user.username),
            iconURL: interaction.user.displayAvatarURL()
        });

    await logChannel.send({ embeds: [embed] });

    return true;
}

module.exports = LogGroup;