/**
 * @file        commands/verificationplus.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description A command for moderators to verify users to add them to the verified plus role.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ApplicationCommandOptionType, Colors } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const DISCORD_SERVER_SETTINGS = require("../discordsettings");
const RandomColor = require("../randomcolor");
const { D1Class } = require("../d1class");

// =================================================================================================
// Variables
// =================================================================================================

const verificationPlusCommand = new ModularCommand('verifyuser')
    .setDescription('Verify a user for +18 access (Moderator only).')
    .setCooldown(5);

verificationPlusCommand.addOption({
    name: 'user',
    type: ApplicationCommandOptionType.User,
    description: 'The user to verify for +18 access.',
    required: true,
});

// =================================================================================================
// Localization
// =================================================================================================

verificationPlusCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Verify a user for +18 access (Moderator only).',
    [Locale.SpanishLATAM]: 'Verificar un usuario para acceso +18 (Solo moderadores).',
    [Locale.SpanishES]: '¡Verificar un tío para acceso +18 (Solo moderadores, joder)!',
});

verificationPlusCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'The user to verify for +18 access.',
    },
    [Locale.SpanishLATAM]: {
        'user': 'El usuario a verificar para acceso +18.',
    },
    [Locale.SpanishES]: {
        'user': '¡El tío que quieres verificar para acceso +18, chaval!',
    },
});

verificationPlusCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.access_denied_title': '❌ Access Denied',
        'error.no_permission': 'You do not have permission to use this command.',
        'error.user_not_verified_title': '❌ VRChat Account Not Linked',
        'error.user_not_found': 'User profile not found in the system.',
        'error.user_not_verified': 'The user must link their VRChat account to their Discord account before receiving +18 verification.',
        'error.missing_role_title': '❌ Missing Verification Role',
        'error.user_no_role': 'The user does not have the required verification role.',
        'error.config_error_title': '❌ Configuration Error',
        'error.role_not_configured': 'The +18 verification role has not been configured for this server.',
        'error.user_not_found_title': '❌ User Not Found',
        'error.role_not_found_title': '❌ Role Not Found',
        'error.role_not_found': 'The configured +18 verification role was not found in the server.',
        'error.already_verified_title': '❌ Already Verified',
        'error.user_already_has_role': 'The user already has the +18 verification role.',
        'error.assignment_failed_title': '❌ Role Assignment Failed',
        'error.failed_to_assign': 'Failed to assign the +18 verification role to the user.',
        'error.internal_error_title': '❌ Internal Error',
        'error.internal_error_description': 'An internal error occurred while processing the command.',
        'success.title': '✅ User Verified for +18 Access',
        'success.description': 'Successfully verified **{username}** for +18 access and assigned the role.',
        'success.footer': 'Verification completed by {moderator}',
        'success_already.title': '✅ User Already Verified for +18 Access',
        'success_already.description': 'The user **{username}** is already verified for +18 access and now has the role.',
    },
    [Locale.SpanishLATAM]: {
        'error.access_denied_title': '❌ Acceso Denegado',
        'error.no_permission': 'No tienes permisos para utilizar este comando.',
        'error.user_not_verified_title': '❌ Cuenta de VRChat No Vinculada',
        'error.user_not_found': 'Perfil de usuario no encontrado en el sistema.',
        'error.user_not_verified': 'El usuario debe vincular su cuenta de VRChat con su cuenta de Discord antes de recibir la verificación +18.',
        'error.user_already_has_role': 'El usuario ya tiene el rol de verificación +18.',
        'error.user_no_role': 'El usuario no tiene el rol de verificación requerido.',
        'error.missing_role_title': '❌ Rol de Verificación Faltante',
        'error.config_error_title': '❌ Error de Configuración',
        'error.user_not_found_title': '❌ Usuario No Encontrado',
        'error.role_not_found_title': '❌ Rol No Encontrado',
        'error.role_not_found': 'El rol de verificación +18 configurado no fue encontrado en el servidor.',
        'error.role_not_configured': 'El rol de verificación +18 no ha sido configurado para este servidor.',
        'error.already_verified_title': '❌ Ya Verificado',
        'error.assignment_failed_title': '❌ Fallo al Asignar Rol',
        'error.failed_to_assign': 'No se pudo asignar el rol de verificación +18 al usuario.',
        'error.internal_error_title': '❌ Error Interno',
        'error.internal_error_description': 'Ocurrió un error interno al procesar el comando.',
        'success.title': '✅ Usuario Verificado para Acceso +18',
        'success.description': 'Se verificó exitosamente a **{username}** para acceso +18 y se asignó el rol.',
        'success.footer': 'Verificación completada por {moderator}',
        'success_already.title': '✅ Usuario ya esta verificado para el Acceso +18',
        'success_already.description': 'El usuario **{username}** ya está verificado para el Acceso +18, se le ha dado el rol.',
    },
    [Locale.SpanishES]: {
        'error.access_denied_title': '❌ ¡Acceso Denegado, Tío!',
        'error.no_permission': '¡Joder tío, no tienes permisos pa usar este comando, chaval!',
        'error.user_not_verified_title': '❌ ¡Cuéntame, la Cuenta de VRChat No Está Vinculá, eh!',
        'error.user_not_found': '¡Ay, madre mía! ¡Ostras! No encontramos el perfil del tío en el sistema, macho.',
        'error.user_not_verified': '¡Joder, vaya tela! El fulano tiene que vincular su cuenta de VRChat con Discord antes de que le dé la verificación +18, ¿pa qué lo quieres?',
        'error.missing_role_title': '❌ ¡Falta el Rol, Tío, que Vaya Locura!',
        'error.user_no_role': '¡Ostras, chaval! ¡Joder! El tío no tiene el rol de verificación, ¡qué cosa tan rara, eh!',
        'error.config_error_title': '❌ ¡Vaya Metedura de Pata con la Configuración!',
        'error.role_not_configured': '¡Madre mía, Willy! ¡Que no está configurao el rol de verificación +18 pa este servidor, tío!',
        'error.user_not_found_title': '❌ ¡Que Desaparece el Usuario, Joder!',
        'error.role_not_found_title': '❌ ¡Que Se Lo Llevó El Viento al Rol!',
        'error.role_not_found': '¡Ay, ostras chaval! ¡Joder! No encontramos el rol de verificación +18 por ningún lado en el servidor.',
        'error.already_verified_title': '❌ ¡Que Ya Está Verificao, Macho!',
        'error.user_already_has_role': '¡Vamos tío! ¡Que ya tiene el rol de verificación +18 el fulano! ¡Qué nervio!',
        'error.assignment_failed_title': '❌ ¡Se Ha Liado la Cosa con el Rol, Vaya!',
        'error.failed_to_assign': '¡Ay, que no se pudo asignar el rol, tío! ¡Joder, qué cosa tan rara! ¡Madre mía!',
        'error.internal_error_title': '❌ ¡Error Interno, Qué Cosa Tan Rara!',
        'error.internal_error_description': '¡Ostras, chaval! ¡Joder! Algo se ha roto por dentro, ¡que vaya lío!',
        'success.title': '✅ ¡Tío Verificao Pa los +18, Olé!',
        'success.description': '¡Vaya! ¡Ostras, chaval! Se verificó exitosamente a **{username}** pa acceso +18 y se le asignó el rol, ¡qué bien, eh!',
        'success.footer': '¡Verificación completá por {moderator}, joder, que bien! ¡Olé!',
        'success_already.title': '✅ ¡Tío Verificao Pa los +18, Olé!',
        'success_already.description': '¡Vaya! ¡Ostras, chaval! Se verificó exitosamente a **{username}** pa acceso +18 y se le asignó el rol, ¡qué bien, eh!',
    },
});

// =================================================================================================
// Permission Check
// =================================================================================================

verificationPlusCommand.setPermissionCheck(async ({ interaction }) => {
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

verificationPlusCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    // Fetch target user
    const targetUser = args.user;
    const guildId = interaction.guild.id;

    // Check if target user exists in the guild
    const member = await interaction.guild.members.fetch(targetUser.id);
    if (!member) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.user_not_found_title'])
            .setDescription(locale['error.user_not_found'])
            .setColor(Colors.Red)
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    // Request user profile data
    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    }

    let profileData = null;
    try {
        profileData = await D1Class.getProfile(userRequestData, targetUser.id, false);
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.user_not_verified_title'])
            .setDescription(locale['error.user_not_verified'])
            .setColor(Colors.Red)
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    // Getting server roles and settings
    const settings = await D1Class.getAllDiscordSettings(userRequestData, guildId);
    const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
    const verificationPlusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];

    await interaction.guild.roles.fetch();

    // Verification Role
    const verificationRole = interaction.guild.roles.cache.get(verificationRoleId);
    if (!verificationRole) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.role_not_found_title'])
            .setDescription(locale['error.role_not_found'])
            .setColor(Colors.Red)
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    // Verification Plus Role
    const verificationPlusRole = interaction.guild.roles.cache.get(verificationPlusRoleId);
    if (!verificationPlusRole) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.role_not_found_title'])
            .setDescription(locale['error.role_not_found'])
            .setColor(Colors.Red)
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    const userWithVerificationRole = verificationRole.members.find(member => member.id === targetUser.id);
    const userWithVerificationPlusRole = verificationPlusRole.members.find(member => member.id === targetUser.id);

    // If the user has no verification role, then give it
    if (userWithVerificationRole === undefined) {
        await member.roles.add(verificationRoleId);
    }

    // If the user has verification plus role, but isn't not verified in DB, then remove it
    if (userWithVerificationPlusRole !== undefined && !profileData.is_verified) {
        await member.roles.remove(verificationPlusRoleId);
    }

    // If the user is verified in DB, but doesn't have verification plus role, then give it
    if (userWithVerificationPlusRole === undefined && profileData.is_verified) {
        await member.roles.add(verificationPlusRoleId);

        const embed = new EmbedBuilder()
            .setTitle(locale['success_already.title'])
            .setDescription(locale['success_already.description'].replace('{username}', targetUser.displayName))
            .setColor(RandomColor())
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({
                text: locale['success.footer'].replace('{moderator}', interaction.user.displayName),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    // If the user has verification plus role and is verified in DB, then do nothing
    if (userWithVerificationPlusRole !== undefined && profileData.is_verified) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.already_verified_title'])
            .setDescription(locale['error.user_already_has_role'])
            .setColor(Colors.Green)
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    }

    // Assign the +18 role
    try {
        await member.roles.add(verificationPlusRoleId);

        // Update profile to mark as 18+ verified if not already
        await D1Class.verifyProfile(userRequestData, targetUser.id, {
            verification_id: 1,
            verified_from: guildId,
        });

        // Success response
        const embed = new EmbedBuilder()
            .setTitle(locale['success.title'])
            .setDescription(locale['success.description'].replace('{username}', targetUser.displayName))
            .setColor(RandomColor())
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({
                text: locale['success.footer'].replace('{moderator}', interaction.user.displayName),
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (roleError) {
        const embed = new EmbedBuilder()
            .setTitle(locale['error.assignment_failed_title'])
            .setDescription(locale['error.failed_to_assign'])
            .setColor(Colors.Red)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
});

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = RegisterCommand([verificationPlusCommand]);