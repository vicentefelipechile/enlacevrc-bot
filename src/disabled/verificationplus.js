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
const Profile = require("../models/profile");
const DiscordSettings = require("../models/discord");
const DISCORD_SERVER_SETTINGS = require("../models/discordsettings");
const RandomColor = require("../randomcolor");

// =================================================================================================
// Variables
// =================================================================================================

const ONLY_ALLOWED = [
    '12345',
    '67890',
]

const verificationPlusCommand = new ModularCommand('verificationplus')
    .setDescription('Verify a user for +18 access (Moderator only).')
    .setCooldown(5)
    .setPermissionCheck(async (interaction) => {
        return ONLY_ALLOWED.includes(interaction.user.id);
    });

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
        'error.user_not_verified_title': '❌ User Not Verified',
        'error.user_not_found': 'User profile not found in the system.',
        'error.user_not_verified': 'The user must be verified before they can receive +18 verification.',
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
    },
    [Locale.SpanishLATAM]: {
        'error.access_denied_title': '❌ Acceso Denegado',
        'error.no_permission': 'No tienes permisos para utilizar este comando.',
        'error.user_not_verified_title': '❌ Usuario No Verificado',
        'error.user_not_found': 'Perfil de usuario no encontrado en el sistema.',
        'error.user_not_verified': 'El usuario debe estar verificado antes de recibir la verificación +18.',
        'error.missing_role_title': '❌ Rol de Verificación Faltante',
        'error.user_no_role': 'El usuario no tiene el rol de verificación requerido.',
        'error.config_error_title': '❌ Error de Configuración',
        'error.role_not_configured': 'El rol de verificación +18 no ha sido configurado para este servidor.',
        'error.user_not_found_title': '❌ Usuario No Encontrado',
        'error.role_not_found_title': '❌ Rol No Encontrado',
        'error.role_not_found': 'El rol de verificación +18 configurado no fue encontrado en el servidor.',
        'error.already_verified_title': '❌ Ya Verificado',
        'error.user_already_has_role': 'El usuario ya tiene el rol de verificación +18.',
        'error.assignment_failed_title': '❌ Fallo al Asignar Rol',
        'error.failed_to_assign': 'No se pudo asignar el rol de verificación +18 al usuario.',
        'error.internal_error_title': '❌ Error Interno',
        'error.internal_error_description': 'Ocurrió un error interno al procesar el comando.',
        'success.title': '✅ Usuario Verificado para Acceso +18',
        'success.description': 'Se verificó exitosamente a **{username}** para acceso +18 y se asignó el rol.',
        'success.footer': 'Verificación completada por {moderator}',
    },
    [Locale.SpanishES]: {
        'error.access_denied_title': '❌ ¡Acceso Denegado, Tío!',
        'error.no_permission': '¡Joder tío, no tienes permisos para usar este comando!',
        'error.user_not_verified_title': '❌ ¡Usuario No Verificado, Chaval!',
        'error.user_not_found': '¡Ostras chaval! No se encontró el perfil del usuario en el sistema.',
        'error.user_not_verified': '¡Madre mía Willy! El tío debe estar verificado antes de recibir la verificación +18.',
        'error.missing_role_title': '❌ ¡Falta el Rol, Macho!',
        'error.user_no_role': '¡Joder macho! El usuario no tiene el rol de verificación requerido.',
        'error.config_error_title': '❌ ¡Error de Configuración, Ostras!',
        'error.role_not_configured': '¡Ostras! El rol de verificación +18 no está configurado para este servidor, chaval.',
        'error.user_not_found_title': '❌ ¡Usuario No Encontrado, Joder!',
        'error.role_not_found_title': '❌ ¡Rol No Encontrado, Madre Mía!',
        'error.role_not_found': '¡Madre mía! No se encontró el rol de verificación +18 configurado en el servidor.',
        'error.already_verified_title': '❌ ¡Ya Verificado, Tío!',
        'error.user_already_has_role': '¡Tío! El usuario ya tiene el rol de verificación +18.',
        'error.assignment_failed_title': '❌ ¡Fallo al Asignar Rol, Joder!',
        'error.failed_to_assign': '¡Joder macho! No se pudo asignar el rol de verificación +18 al usuario.',
        'error.internal_error_title': '❌ ¡Error Interno, Ostras!',
        'error.internal_error_description': '¡Joder chaval! Ocurrió un error interno al procesar el comando.',
        'success.title': '✅ ¡Tío Verificado para Acceso +18!',
        'success.description': '¡Ostras chaval! Se verificó exitosamente a **{username}** para acceso +18 y se asignó el rol.',
        'success.footer': '¡Verificación completada por {moderator}, joder!',
    },
});

// =================================================================================================
// Command Logic
// =================================================================================================

verificationPlusCommand.setExecute(async ({ interaction, locale, args, command }) => {
    await interaction.deferReply();
    
    try {
        const targetUser = args.user;
        const guildId = interaction.guild.id;

        // Check if user profile exists in the system
        const profile = await Profile.create(targetUser.id, true);
        const verified = await profile.isVerified();

        if (!verified) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.user_not_verified_title'])
                .setDescription(locale['error.user_not_verified'])
                .setColor(Colors.Red)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Get server settings for verification role and +18 role
        const verificationRoleId = await DiscordSettings.get(guildId, DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE);
        const verificationPlusRoleId = await DiscordSettings.get(guildId, DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE);

        if (!verificationPlusRoleId) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.config_error_title'])
                .setDescription(locale['error.role_not_configured'])
                .setColor(Colors.Red)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Get the guild member and check if they have verification role
        const member = await interaction.guild.members.fetch(targetUser.id);
        if (!member) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.user_not_found_title'])
                .setDescription(locale['error.user_not_found'])
                .setColor(Colors.Red)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Check if user has the basic verification role
        if (verificationRoleId && !member.roles.cache.has(verificationRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.missing_role_title'])
                .setDescription(locale['error.user_no_role'])
                .setColor(Colors.Red)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Check if the +18 role exists in the server
        const verificationPlusRole = interaction.guild.roles.cache.get(verificationPlusRoleId);
        if (!verificationPlusRole) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.role_not_found_title'])
                .setDescription(locale['error.role_not_found'])
                .setColor(Colors.Red)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Check if user already has the +18 role
        if (member.roles.cache.has(verificationPlusRoleId)) {
            const embed = new EmbedBuilder()
                .setTitle(locale['error.already_verified_title'])
                .setDescription(locale['error.user_already_has_role'])
                .setColor(Colors.Orange)
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // Assign the +18 role
        try {
            await member.roles.add(verificationPlusRoleId);
            
            // Update profile to mark as 18+ verified
            await profile.verify18Plus();
            
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

    } catch (error) {
        console.error('Error in verification plus command:', error);
        
        const embed = new EmbedBuilder()
            .setTitle(locale['error.internal_error_title'])
            .setDescription(locale['error.internal_error_description'])
            .setColor(Colors.Red)
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
});

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = RegisterCommand([verificationPlusCommand]);