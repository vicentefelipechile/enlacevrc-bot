/**
 * @file        commands/sync.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to synchronize user roles and nickname based on their VRChat profile.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, Colors } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { D1Class } = require("../d1class");
const DISCORD_SERVER_SETTINGS = require("../discordsettings");

// =================================================================================================
// Variables
// =================================================================================================

const syncCommand = new ModularCommand('sync')
    .setDescription('Synchronize your roles and nickname with your VRChat profile.')
    .setCooldown(10);

// =================================================================================================
// Localization
// =================================================================================================

syncCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Synchronize your roles and nickname with your VRChat profile.',
    [Locale.SpanishLATAM]: 'Sincroniza tus roles y apodo con tu perfil de VRChat.',
    [Locale.SpanishES]: 'Sincroniza tus roles y apodo con tu perfil de VRChat, ¡así de fácil!',
});

syncCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.no_profile': 'You do not have a linked VRChat profile. Please use `/verification` first.',
        'error.banned': 'You are banned from the system and cannot sync.',
        'error.generic': 'An error occurred while syncing. Please try again later.',
        'success.title': 'Synchronization Complete',
        'success.description': 'Your profile has been synchronized successfully.',
        'success.roles_title': 'Roles Added',
        'success.nickname_title': 'Nickname Updated',
        'success.no_changes': 'Your profile is already up to date.',
        'log.role_fail': 'Failed to add role {role}: {error}',
        'log.nickname_fail': 'Failed to update nickname: {error}',
        'log.plus_role_fail': 'Failed to add plus role {role}: {error}',
    },
    [Locale.SpanishLATAM]: {
        'error.no_profile': 'No tienes un perfil de VRChat vinculado. Por favor, usa `/verification` primero.',
        'error.banned': 'Estás baneado del sistema y no puedes sincronizar.',
        'error.generic': 'Ocurrió un error al sincronizar. Por favor, inténtalo de nuevo más tarde.',
        'success.title': 'Sincronización Completada',
        'success.description': 'Tu perfil ha sido sincronizado exitosamente.',
        'success.roles_title': 'Roles Añadidos',
        'success.nickname_title': 'Apodo Actualizado',
        'success.no_changes': 'Tu perfil ya está actualizado.',
        'log.role_fail': 'No se pudo añadir el rol {role}: {error}',
        'log.nickname_fail': 'No se pudo actualizar el apodo: {error}',
        'log.plus_role_fail': 'No se pudo añadir el rol 18+: {error}',
    },
    [Locale.SpanishES]: {
        'error.no_profile': '¡Que no tienes perfil vinculado, alma de cántaro! Usa `/verification` antes.',
        'error.banned': 'Estás baneado, colega. Aquí no se sincroniza nada.',
        'error.generic': '¡Vaya tela! Algo ha petado al sincronizar. Prueba luego.',
        'success.title': '¡Sincronización al Pelo!',
        'success.description': 'Tu perfil se ha quedado niquelado.',
        'success.roles_title': 'Roles que te han caído',
        'success.nickname_title': 'Apodo nuevo',
        'success.no_changes': '¡Pero si ya estás perfecto! No hay nada que cambiar.',
        'log.role_fail': '¡Ostras! No he podido ponerte el rol {role}: {error}',
        'log.nickname_fail': '¡Joder! No he podido cambiarte el apodo: {error}',
        'log.plus_role_fail': '¡Joder! No he podido ponerte el rol 18+: {error}',
    }
});

// =================================================================================================
// Command Execution
// =================================================================================================

syncCommand.setExecute(async ({ interaction, locale }) => {
    await interaction.deferReply();

    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };

    let profileData = null;
    try {
        profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
    } catch (error) {
        // Profile not found or API error
    }

    if (!profileData) {
        return interaction.editReply({
            content: locale['error.no_profile'],
            embeds: []
        });
    }

    if (profileData.is_banned) {
        return interaction.editReply({
            content: locale['error.banned'],
            embeds: []
        });
    }

    const guildId = interaction.guild.id;
    const settings = await D1Class.getAllDiscordSettings(userRequestData, guildId);
    const member = interaction.member;

    const changes = {
        rolesAdded: [],
        nicknameUpdated: false,
        nickname: null
    };

    // 1. Basic Verification Role
    const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
    if (verificationRoleId) {
        const role = interaction.guild.roles.cache.get(verificationRoleId);
        if (role && !member.roles.cache.has(verificationRoleId)) {
            try {
                await member.roles.add(role);
                changes.rolesAdded.push(role.toString());
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle(locale['log.role_fail'])
                    .setDescription(error);
                return await interaction.editReply({ embeds: [embed] });
            }
        }
    }

    // 2. Auto Nickname
    if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === '1') {
        const newNickname = profileData.vrchat_name;
        if (member.nickname !== newNickname && member.user.username !== newNickname) { // Check if nickname is different
            try {
                // Check hierarchy before attempting to change nickname
                if (interaction.guild.members.me.roles.highest.position > member.roles.highest.position) {
                    await member.setNickname(newNickname);
                    changes.nicknameUpdated = true;
                    changes.nickname = newNickname;
                }
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle(locale['log.nickname_fail'])
                    .setDescription(error);
                return await interaction.editReply({ embeds: [embed] });
            }
        }
    }

    // 3. Plus Verification Role (18+)
    if (profileData.is_verified) {
        const verificationPlusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];
        if (verificationPlusRoleId) {
            const role = interaction.guild.roles.cache.get(verificationPlusRoleId);
            if (role && !member.roles.cache.has(verificationPlusRoleId)) {
                try {
                    await member.roles.add(role);
                    changes.rolesAdded.push(role.toString());
                } catch (error) {
                    const embed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle(locale['log.role_fail'])
                        .setDescription(error);
                    return await interaction.editReply({ embeds: [embed] });
                }
            }
        }
    }

    // Build Response
    const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(locale['success.title'])
        .setDescription(locale['success.description']);

    let hasChanges = false;

    let rolesList = '';
    for (const role of changes.rolesAdded) {
        rolesList += `\n- ${role}`;
    }

    if (rolesList) {
        embed.addFields({
            name: locale['success.roles_title'],
            value: rolesList
        });
        hasChanges = true;
    }

    if (changes.nicknameUpdated) {
        embed.addFields({
            name: locale['success.nickname_title'],
            value: changes.nickname
        });
        hasChanges = true;
    }

    if (!hasChanges) {
        embed.setDescription(locale['success.no_changes']);
    }

    await interaction.editReply({
        embeds: [embed]
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([syncCommand]);
