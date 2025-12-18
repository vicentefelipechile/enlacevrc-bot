/**
 * @file        commands/ban.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description A command for staff to ban users from the database (not from Discord).
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ApplicationCommandOptionType, Colors, AttachmentBuilder } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { D1Class } = require("../d1class");

// =================================================================================================
// Variables
// =================================================================================================

const banCommand = new ModularCommand('ban')
    .setDescription('Ban a user from the database (Staff only).')
    .setCooldown(5);

const SUBCOMMAND = {
    USER: 'user',
    ID: 'id',
}

const ARGS = {
    USER: 'user',
    ID: 'id',
    REASON: 'reason',
}

banCommand.addSubCommand({
    name: SUBCOMMAND.USER,
    description: 'Ban a user from the database.',
    options: [
        {
            name: ARGS.USER,
            type: ApplicationCommandOptionType.User,
            description: 'The user to ban from the database.',
            required: true,
        },
        {
            name: ARGS.REASON,
            type: ApplicationCommandOptionType.String,
            description: 'The reason for the ban.',
            required: true,
        },
    ],
})

banCommand.addSubCommand({
    name: SUBCOMMAND.ID,
    description: 'Ban a user from the database.',
    options: [
        {
            name: ARGS.ID,
            type: ApplicationCommandOptionType.String,
            description: 'The user to ban from the database.',
            required: true,
        },
        {
            name: ARGS.REASON,
            type: ApplicationCommandOptionType.String,
            description: 'The reason for the ban.',
            required: true,
        },
    ],
})

const errorImage = new AttachmentBuilder('img/error.jpg', { name: 'error.jpg' });
const errorUrl = 'attachment://' + errorImage.name;

// =================================================================================================
// Localization
// =================================================================================================

banCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Ban a user from the database (Staff only).',
    [Locale.SpanishLATAM]: 'Banear un usuario de la base de datos (Solo staff).',
    [Locale.SpanishES]: '¡Banear un tío de la base de datos (Solo staff, joder)!',
});

banCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.access_denied_title': '❌ Access Denied',
        'error.no_permission': 'You do not have permission to use this command.',
        'error.user_not_found_title': '❌ User Not Found',
        'error.user_not_found': 'User profile not found in the database.',
        'error.already_banned_title': '❌ Already Banned',
        'error.already_banned': 'This user is already banned from the database.',
        'error.ban_failed_title': '❌ Ban Failed',
        'error.ban_failed': 'Failed to ban the user from the database.',
        'error.internal_error_title': '❌ Internal Error',
        'error.internal_error_description': 'An internal error occurred while processing the command.',
        'success.title': '✅ User Banned',
        'success.description': 'Successfully banned **{username}** from the database, now the user will not be able to unlink their VRChat account with Discord, nor will they be able to verify in other servers globally.',
        'success.reason': '**Reason:** {reason}',
        'success.footer': 'Banned by {moderator}',
    },
    [Locale.SpanishLATAM]: {
        'error.access_denied_title': '❌ Acceso Denegado',
        'error.no_permission': 'No tienes permisos para utilizar este comando.',
        'error.user_not_found_title': '❌ Usuario No Encontrado',
        'error.user_not_found': 'Perfil de usuario no encontrado en la base de datos.',
        'error.already_banned_title': '❌ Ya Baneado',
        'error.already_banned': 'Este usuario ya está baneado de la base de datos.',
        'error.ban_failed_title': '❌ Fallo al Banear',
        'error.ban_failed': 'No se pudo banear al usuario de la base de datos.',
        'error.internal_error_title': '❌ Error Interno',
        'error.internal_error_description': 'Ocurrió un error interno al procesar el comando.',
        'success.title': '✅ Usuario Baneado',
        'success.description': 'Se baneó exitosamente a **{username}** de la base de datos, ahora el usuario no podra desvincular su cuenta de VRChat con la de Discord, tampoco podra verificarse en otros servidores de manera global.',
        'success.reason': '**Razón:** {reason}',
        'success.footer': 'Baneado por {moderator}',
    },
    [Locale.SpanishES]: {
        'error.access_denied_title': '❌ ¡Acceso Denegado, Tío!',
        'error.no_permission': '¡Joder tío, no tienes permisos pa usar este comando, chaval!',
        'error.user_not_found_title': '❌ ¡Que Desaparece el Usuario, Joder!',
        'error.user_not_found': '¡Ay, madre mía! ¡Ostras! No encontramos el perfil del tío en la base de datos, macho.',
        'error.already_banned_title': '❌ ¡Que Ya Está Baneao, Macho!',
        'error.already_banned': '¡Vamos tío! ¡Que ya está baneao de la base de datos el fulano! ¡Qué nervio!',
        'error.ban_failed_title': '❌ ¡Se Ha Liado la Cosa con el Baneo, Vaya!',
        'error.ban_failed': '¡Ay, que no se pudo banear al tío, joder! ¡Qué cosa tan rara! ¡Madre mía!',
        'error.internal_error_title': '❌ ¡Error Interno, Qué Cosa Tan Rara!',
        'error.internal_error_description': '¡Ostras, chaval! ¡Joder! Algo se ha roto por dentro, ¡que vaya lío!',
        'success.title': '✅ ¡Tío Baneao, Olé!',
        'success.description': '¡Vaya! ¡Ostras, chaval! Se baneó exitosamente a **{username}** de la base de datos, ahora el usuario no podra desvincular su cuenta de VRChat con la de Discord, tampoco podra verificarse en otros servidores de manera global.',
        'success.reason': '**Razón:** {reason}',
        'success.footer': '¡Baneao por {moderator}, joder, que bien! ¡Olé!',
    },
});

banCommand.setLocalizationSubCommands({
    [Locale.EnglishUS]: {
        [`${SUBCOMMAND.USER}`]: 'Ban a user',
        [`${SUBCOMMAND.USER}.description`]: 'Ban a user',
        [`${SUBCOMMAND.USER}.${ARGS.USER}`]: 'User to ban',
        [`${SUBCOMMAND.USER}.${ARGS.USER}.description`]: 'User to ban',
        [`${SUBCOMMAND.USER}.${ARGS.REASON}`]: 'Reason for the ban',
        [`${SUBCOMMAND.USER}.${ARGS.REASON}.description`]: 'Reason for the ban',
        [`${SUBCOMMAND.ID}`]: 'Ban a user using their ID',
        [`${SUBCOMMAND.ID}.description`]: 'Ban a user using their ID',
        [`${SUBCOMMAND.ID}.${ARGS.ID}`]: 'User ID to ban',
        [`${SUBCOMMAND.ID}.${ARGS.ID}.description`]: 'User ID to ban',
        [`${SUBCOMMAND.ID}.${ARGS.REASON}`]: 'Reason for the ban',
        [`${SUBCOMMAND.ID}.${ARGS.REASON}.description`]: 'Reason for the ban',
    },
})

// =================================================================================================
// Permission Check
// =================================================================================================

banCommand.setPermissionCheck(async (interaction) => {
    let exists = false;
    try {
        const staff = await D1Class.getStaff({
            discord_id: interaction.user.id,
            discord_name: interaction.user.username
        }, interaction.user.id);

        exists = staff !== null;
    } catch (error) {
        exists = false;
    }

    return exists;
});

// =================================================================================================
// Command Logic
// =================================================================================================

banCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    // Fetch target user
    const targetUser = args.user;
    const banReason = args.reason;

    // Request user profile data
    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };

    let profileData = null;
    try {
        profileData = await D1Class.getProfile(userRequestData, targetUser.id, false);
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.user_not_found_title'])
            .setDescription(locale['error.user_not_found'])
            .setColor(Colors.Red)
            .setThumbnail(errorUrl)
            .setTimestamp();

        return await interaction.editReply({
            embeds: [embed],
            files: [errorImage],
        });
    }

    // Check if user is already banned
    if (profileData.is_banned) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.already_banned_title'])
            .setDescription(locale['error.already_banned'])
            .setColor(Colors.Orange)
            .setThumbnail(errorUrl)
            .setTimestamp();

        return await interaction.editReply({
            embeds: [embed],
            files: [errorImage],
        });
    }

    // Ban the user
    try {
        await D1Class.banProfile(userRequestData, targetUser.id, banReason);

        // Success response
        const embed = new EmbedBuilder()
            .setTitle(locale['success.title'])
            .setDescription(locale['success.description'].replace('{username}', targetUser.displayName))
            .addFields({
                name: '\u200B',
                value: locale['success.reason'].replace('{reason}', banReason)
            })
            .setColor(Colors.Green)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({
                text: locale['success.footer'].replace('{moderator}', interaction.user.displayName),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (banError) {
        console.error('Ban error:', banError);

        const embed = new EmbedBuilder()
            .setTitle(locale['error.ban_failed_title'])
            .setDescription(locale['error.ban_failed'])
            .setColor(Colors.Red)
            .setThumbnail(errorUrl)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [errorImage] });
    }
});

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = RegisterCommand([banCommand]);
