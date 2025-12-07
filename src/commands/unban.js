/**
 * @file        commands/unban.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description A command for staff to unban users from the database (not from Discord).
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

const unbanCommand = new ModularCommand('unban')
    .setDescription('Unban a user from the database (Staff only).')
    .setCooldown(5);

unbanCommand.addOption({
    name: 'user',
    type: ApplicationCommandOptionType.User,
    description: 'The user to unban from the database.',
    required: true,
});

const errorImage = new AttachmentBuilder('img/error.jpg', { name: 'error.jpg' });
const errorUrl = 'attachment://' + errorImage.name;

// =================================================================================================
// Localization
// =================================================================================================

unbanCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Unban a user from the database (Staff only).',
    [Locale.SpanishLATAM]: 'Desbanear un usuario de la base de datos (Solo staff).',
    [Locale.SpanishES]: '¡Desbanear un tío de la base de datos (Solo staff, joder)!',
});

unbanCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'The user to unban from the database.',
    },
    [Locale.SpanishLATAM]: {
        'user': 'El usuario a desbanear de la base de datos.',
    },
    [Locale.SpanishES]: {
        'user': '¡El tío que quieres desbanear de la base de datos, chaval!',
    },
});

unbanCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.access_denied_title': '❌ Access Denied',
        'error.no_permission': 'You do not have permission to use this command.',
        'error.user_not_found_title': '❌ User Not Found',
        'error.user_not_found': 'User profile not found in the database.',
        'error.not_banned_title': '❌ Not Banned',
        'error.not_banned': 'This user is not banned from the database.',
        'error.unban_failed_title': '❌ Unban Failed',
        'error.unban_failed': 'Failed to unban the user from the database.',
        'error.internal_error_title': '❌ Internal Error',
        'error.internal_error_description': 'An internal error occurred while processing the command.',
        'success.title': '✅ User Unbanned',
        'success.description': 'Successfully unbanned **{username}** from the database.',
        'success.footer': 'Unbanned by {moderator}',
    },
    [Locale.SpanishLATAM]: {
        'error.access_denied_title': '❌ Acceso Denegado',
        'error.no_permission': 'No tienes permisos para utilizar este comando.',
        'error.user_not_found_title': '❌ Usuario No Encontrado',
        'error.user_not_found': 'Perfil de usuario no encontrado en la base de datos.',
        'error.not_banned_title': '❌ No Está Baneado',
        'error.not_banned': 'Este usuario no está baneado de la base de datos.',
        'error.unban_failed_title': '❌ Fallo al Desbanear',
        'error.unban_failed': 'No se pudo desbanear al usuario de la base de datos.',
        'error.internal_error_title': '❌ Error Interno',
        'error.internal_error_description': 'Ocurrió un error interno al procesar el comando.',
        'success.title': '✅ Usuario Desbaneado',
        'success.description': 'Se desbaneó exitosamente a **{username}** de la base de datos.',
        'success.footer': 'Desbaneado por {moderator}',
    },
    [Locale.SpanishES]: {
        'error.access_denied_title': '❌ ¡Acceso Denegado, Tío!',
        'error.no_permission': '¡Joder tío, no tienes permisos pa usar este comando, chaval!',
        'error.user_not_found_title': '❌ ¡Que Desaparece el Usuario, Joder!',
        'error.user_not_found': '¡Ay, madre mía! ¡Ostras! No encontramos el perfil del tío en la base de datos, macho.',
        'error.not_banned_title': '❌ ¡Que No Está Baneao, Tío!',
        'error.not_banned': '¡Vamos chaval! ¡Que no está baneao de la base de datos el fulano! ¡Qué cosa tan rara!',
        'error.unban_failed_title': '❌ ¡Se Ha Liado la Cosa con el Desbaneo, Vaya!',
        'error.unban_failed': '¡Ay, que no se pudo desbanear al tío, joder! ¡Qué cosa tan rara! ¡Madre mía!',
        'error.internal_error_title': '❌ ¡Error Interno, Qué Cosa Tan Rara!',
        'error.internal_error_description': '¡Ostras, chaval! ¡Joder! Algo se ha roto por dentro, ¡que vaya lío!',
        'success.title': '✅ ¡Tío Desbaneao, Olé!',
        'success.description': '¡Vaya! ¡Ostras, chaval! Se desbaneó exitosamente a **{username}** de la base de datos, ¡qué bien, eh!',
        'success.footer': '¡Desbaneao por {moderator}, joder, que bien! ¡Olé!',
    },
});

// =================================================================================================
// Permission Check
// =================================================================================================

unbanCommand.setPermissionCheck(async (interaction) => {
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

unbanCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    // Fetch target user
    const targetUser = args.user;

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

    // Check if user is not banned
    if (!profileData.is_banned) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.not_banned_title'])
            .setDescription(locale['error.not_banned'])
            .setColor(Colors.Orange)
            .setThumbnail(errorUrl)
            .setTimestamp();

        return await interaction.editReply({
            embeds: [embed],
            files: [errorImage],
        });
    }

    // Unban the user
    try {
        await D1Class.unbanProfile(userRequestData, targetUser.id);

        // Success response
        const embed = new EmbedBuilder()
            .setTitle(locale['success.title'])
            .setDescription(locale['success.description'].replace('{username}', targetUser.displayName))
            .setColor(Colors.Green)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({
                text: locale['success.footer'].replace('{moderator}', interaction.user.displayName),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (unbanError) {
        console.error('Unban error:', unbanError);

        const embed = new EmbedBuilder()
            .setTitle(locale['error.unban_failed_title'])
            .setDescription(locale['error.unban_failed'])
            .setColor(Colors.Red)
            .setThumbnail(errorUrl)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [errorImage] });
    }
});

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = RegisterCommand([unbanCommand]);
