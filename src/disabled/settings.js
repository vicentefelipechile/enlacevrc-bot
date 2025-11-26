/**
 * @file        commands/settings.js
 * @author      vicentefelipechile
 * @description Command to allow server owners to configure bot settings for their Discord server.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { Locale, EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits, Colors } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const DISCORD_SERVER_SETTINGS = require("../discordsettings");
const PrintMessage = require("../print");
const { D1Class } = require("../class/db");

// =================================================================================================
// Variables
// =================================================================================================

const settingsCommand = new ModularCommand('settings')
    .setDescription('Configure bot settings for this server.')
    .setCooldown(5)
    .setPermissionCheck((interaction) => {
        return interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    });

const SUBCOMMANDS_NAME = {
    VERIFICATION_ROLE: DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE,
    VERIFICATION_PLUS_ROLE: DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE,
    VERIFICATION_CHANNEL: DISCORD_SERVER_SETTINGS.VERIFICATION_CHANNEL,
    AUTO_NICKNAME: DISCORD_SERVER_SETTINGS.AUTO_NICKNAME,
    VIEW: 'view',
    RESET: 'reset'
}

// =================================================================================================
// Subcommands
// =================================================================================================

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.VERIFICATION_ROLE,
    description: 'Set the role given to verified users',
    options: [
        {
            name: 'role',
            description: 'The role to assign to verified users',
            type: ApplicationCommandOptionType.Role,
            required: true
        }
    ]
});

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE,
    description: 'Set the role given to 18+ verified users',
    options: [
        {
            name: 'role',
            description: 'The role to assign to 18+ verified users',
            type: ApplicationCommandOptionType.Role,
            required: true
        }
    ]
});

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.VERIFICATION_CHANNEL,
    description: 'Set the channel where verification commands are allowed',
    options: [
        {
            name: 'channel',
            description: 'The channel for verification commands',
            type: ApplicationCommandOptionType.Channel,
            required: true
        }
    ]
});

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.AUTO_NICKNAME,
    description: 'Enable/disable automatic nickname updates from VRChat',
    options: [
        {
            name: 'enabled',
            description: 'Enable or disable auto nickname updates',
            type: ApplicationCommandOptionType.Boolean,
            required: true
        }
    ]
});

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.VIEW,
    description: 'View current server settings'
});

settingsCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.RESET,
    description: 'Reset a specific setting',
    options: [
        {
            name: 'option',
            description: 'The setting to reset',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Verified Role', value: 'verified_role' },
                { name: 'Verified 18+ Role', value: 'verified_18_role' },
                { name: 'Welcome Channel', value: 'welcome_channel' },
                { name: 'Verification Channel', value: 'verification_channel' },
                { name: 'Auto Nickname', value: 'auto_nickname' },
                { name: 'All Settings', value: 'all' }
            ]
        }
    ]
});

// =================================================================================================
// Localization
// =================================================================================================

settingsCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Configure bot settings for this server.',
    [Locale.SpanishLATAM]: 'Configura los ajustes del bot para este servidor.',
    [Locale.SpanishES]: 'Para configurar el bot en este server, que eres el mandamás.',
});

settingsCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.permission': 'You need the "Manage Server" permission to use this command.',
        'error.general': 'An error occurred while processing the settings. Please try again later.',
        'error.setting_failed': 'Failed to update the setting. Please try again.',
        'error.not_found': 'Setting not found or already reset.',
        'success.verification_role': 'Verification role has been set to {role}.',
        'success.verification_plus_role': '18+ verification role has been set to {role}.',
        'success.verification_channel': 'Verification channel has been set to {channel}.',
        'success.auto_nickname': 'Auto nickname update has been {status}.',
        'success.reset': 'Setting "{setting}" has been reset successfully.',
        'success.reset_all': 'All server settings have been reset successfully.',
        'success.settings_registered': 'Default settings have been registered for this server. Try the command again.',
        'status.enabled': 'enabled',
        'status.disabled': 'disabled',
        'view.title': 'Server Settings - {serverName}',
        'view.description': 'Current bot configuration for this server:',
        'view.verification_role': 'Verification Role:',
        'view.verification_plus_role': '18+ Verification Role:',
        'view.verification_channel': 'Verification Channel:',
        'view.auto_nickname': 'Auto Nickname:',
        'view.not_set': 'Not set',
        'view.enabled': 'Enabled',
        'view.disabled': 'Disabled',
    },
    [Locale.SpanishLATAM]: {
        'error.permission': 'Necesitas el permiso "Administrar Servidor" para usar este comando.',
        'error.general': 'Ocurrió un error al procesar la configuración. Por favor, inténtalo de nuevo más tarde.',
        'error.setting_failed': 'No se pudo actualizar la configuración. Por favor, inténtalo de nuevo.',
        'error.not_found': 'Configuración no encontrada o ya restablecida.',
        'success.verification_role': 'El rol de verificación ha sido establecido como {role}.',
        'success.verification_plus_role': 'El rol de verificación +18 ha sido establecido como {role}.',
        'success.verification_channel': 'El canal de verificación ha sido establecido como {channel}.',
        'success.auto_nickname': 'La actualización automática de apodos ha sido {status}.',
        'success.reset': 'La configuración "{setting}" ha sido restablecida exitosamente.',
        'success.reset_all': 'Todas las configuraciones del servidor han sido restablecidas exitosamente.',
        'success.settings_registered': 'Las configuraciones predeterminadas han sido registradas para este servidor. Intenta el comando de nuevo.',
        'status.enabled': 'habilitada',
        'status.disabled': 'deshabilitada',
        'view.title': 'Configuración del Servidor - {serverName}',
        'view.description': 'Configuración actual del bot para este servidor:',
        'view.verification_role': 'Rol de Verificación:',
        'view.verification_plus_role': 'Rol de Verificación +18:',
        'view.verification_channel': 'Canal de Verificación:',
        'view.auto_nickname': 'Apodo Automático:',
        'view.not_set': 'No establecido',
        'view.enabled': 'Habilitado',
        'view.disabled': 'Deshabilitado',
    },
    [Locale.SpanishES]: {
        'error.permission': '¡A ver, tronco! Necesitas el permiso de "Administrar Servidor" para meter mano aquí.',
        'error.general': '¡Madre mía, qué movida! Algo ha fallado con la configuración. Prueba otra vez en un rato, colega.',
        'error.setting_failed': '¡Me cago en la leche! No se ha podido guardar el ajuste. Dale otra vez, que esto no va.',
        'error.not_found': 'Ese ajuste ni está ni se le espera, o ya lo has reseteado, figura.',
        'success.verification_role': '¡De lujo! El rol de verificación ahora es {role}, como Dios manda.',
        'success.verification_plus_role': '¡Canelita en rama! El rol de verificación +18 ahora es {role}.',
        'success.verification_channel': '¡Hecho! El canal de verificación ahora es {channel}, tronco.',
        'success.auto_nickname': 'La actualización automática de apodos está {status}, chaval.',
        'success.reset': 'El ajuste "{setting}" se ha reseteado que da gusto.',
        'success.reset_all': '¡Menuda limpieza! Todos los ajustes del servidor han vuelto a cero, como nuevos.',
        'success.settings_registered': '¡Hostia, que no teníais ni ajustes! Ya os he puesto los predeterminados, probad el comando otra vez, majos.',
        'status.enabled': 'activada, como debe ser',
        'status.disabled': 'desactivada, que tampoco pasa nada',
        'view.title': 'Ajustes del Server - {serverName}',
        'view.description': 'Aquí tienes toda la configuración del bot para este antro, colega:',
        'view.verification_role': 'Rol de Verificación:',
        'view.verification_plus_role': 'Rol de Verificación +18:',
        'view.auto_nickname': 'Apodo Automático:',
        'view.verification_channel': 'Canal de Verificación:',
        'view.not_set': 'Ni puesto, macho',
        'view.enabled': 'Activado',
        'view.disabled': 'Desactivado',
    }
});

settingsCommand.setLocalizationSubCommands({
    [Locale.EnglishUS]: {
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}`]: 'Role for Verified Users',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.description`]: 'Set the role given to verified users',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role`]: 'Role',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role.description`]: 'The role to assign to verified users',

        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}`]: 'Role for 18+ Verified Users',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.description`]: 'Set the role given to 18+ verified users',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role`]: 'Role',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role.description`]: 'The role to assign to 18+ verified users',

        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}`]: 'Channel for Verification',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.description`]: 'Set the channel where verification commands are allowed',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel`]: 'Channel',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel.description`]: 'The channel for verification commands',

        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}`]: 'Auto Nickname Update',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.description`]: 'Enable or disable automatic nickname updates for new members',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled`]: 'Enable Auto Nickname',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled.description`]: 'Enable or disable automatic nickname updates for new members',

        [`${SUBCOMMANDS_NAME.VIEW}`]: 'View Settings',
        [`${SUBCOMMANDS_NAME.VIEW}.description`]: 'View current server settings',

        [`${SUBCOMMANDS_NAME.RESET}`]: 'Reset Setting',
        [`${SUBCOMMANDS_NAME.RESET}.description`]: 'Reset a specific setting or all settings',
        [`${SUBCOMMANDS_NAME.RESET}.setting`]: 'Setting to Reset',
        [`${SUBCOMMANDS_NAME.RESET}.setting.description`]: 'The setting you want to reset',

        [`${SUBCOMMANDS_NAME.RESET}.option`]: 'Setting',
        [`${SUBCOMMANDS_NAME.RESET}.option.description`]: 'The setting to reset',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_role`]: 'Verified Role',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_18_role`]: '18+ Verified Role',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.auto_nickname`]: 'Auto Nickname',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.all`]: 'All Settings'
    },
    [Locale.SpanishLATAM]: {
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}`]: 'Rol para Usuarios Verificados',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.description`]: 'Establece el rol otorgado a los usuarios verificados',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role`]: 'Rol',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role.description`]: 'El rol que se asignará a los usuarios verificados',

        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}`]: 'Rol para Usuarios Verificados +18',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.description`]: 'Establece el rol otorgado a los usuarios verificados +18',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role`]: 'Rol',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role.description`]: 'El rol que se asignará a los usuarios verificados +18',

        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}`]: 'Canal de Verificación',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.description`]: 'Establece el canal donde se permiten los comandos de verificación',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel`]: 'Canal',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel.description`]: 'El canal para los comandos de verificación',

        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}`]: 'Actualización Automática de Apodo',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.description`]: 'Habilita o deshabilita las actualizaciones automáticas de apodo para nuevos miembros',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled`]: 'Habilitar Apodo Automático',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled.description`]: 'Habilita o deshabilita las actualizaciones automáticas de apodo para nuevos miembros',

        [`${SUBCOMMANDS_NAME.VIEW}`]: 'Ver Configuración',
        [`${SUBCOMMANDS_NAME.VIEW}.description`]: 'Ver la configuración actual del servidor',

        [`${SUBCOMMANDS_NAME.RESET}`]: 'Restablecer Configuración',
        [`${SUBCOMMANDS_NAME.RESET}.description`]: 'Restablece una configuración específica o todas las configuraciones',
        [`${SUBCOMMANDS_NAME.RESET}.setting`]: 'Configuración a Restablecer',
        [`${SUBCOMMANDS_NAME.RESET}.setting.description`]: 'La configuración que deseas restablecer',

        [`${SUBCOMMANDS_NAME.RESET}.option`]: 'Configuración',
        [`${SUBCOMMANDS_NAME.RESET}.option.description`]: 'La configuración a restablecer',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_role`]: 'Rol Verificado',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_18_role`]: 'Rol Verificado +18',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.auto_nickname`]: 'Apodo Automático',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.all`]: 'Todas las Configuraciones'
    },
    [Locale.SpanishES]: {
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}`]: '¡Madre mía Willy! Rol pa los verificados',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.description`]: 'Pon aquí el rol que quieres darle a los usuarios verificados, tronco',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role`]: 'El Rol, macho',
        [`${SUBCOMMANDS_NAME.VERIFICATION_ROLE}.role.description`]: '¡Venga va! Elige el rol que se les dará a los verificados, chaval',

        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}`]: '¡Ostras chaval! Rol pa los verificados +18',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.description`]: 'Aquí pones el rol para los mayores de edad verificados, que ya son mayorcitos',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role`]: 'El Rol de adultos',
        [`${SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE}.role.description`]: '¡Joder tío! El rol para los usuarios +18 verificados, que no son críos',

        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}`]: '¡Tío! El canal de verificación',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.description`]: 'Aquí dices en qué canal se pueden usar los comandos de verificación, figura',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel`]: 'El Canal ese',
        [`${SUBCOMMANDS_NAME.VERIFICATION_CHANNEL}.channel.description`]: '¡Hostia colega! Selecciona el canal donde se podrá verificar la peña',

        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}`]: '¡Qué fuerte! Apodo automático',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.description`]: 'Activa o desactiva que se cambien los apodos solos a los nuevos, que mola un huevo',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled`]: '¿Lo activamos o qué?',
        [`${SUBCOMMANDS_NAME.AUTO_NICKNAME}.enabled.description`]: '¡Venga tío! Di si quieres que se actualicen los apodos automáticamente o no, figura',

        [`${SUBCOMMANDS_NAME.VIEW}`]: '¡A ver! Mirar los ajustes',
        [`${SUBCOMMANDS_NAME.VIEW}.description`]: 'Échale un vistazo a cómo tienes montado el chiringuito del servidor',

        [`${SUBCOMMANDS_NAME.RESET}`]: '¡Ojo! Resetear todo',
        [`${SUBCOMMANDS_NAME.RESET}.description`]: 'Dale caña y resetea un ajuste específico o todos de golpe, macho',
        [`${SUBCOMMANDS_NAME.RESET}.setting`]: '¿Qué reseteas, crack?',
        [`${SUBCOMMANDS_NAME.RESET}.setting.description`]: '¡Anda ya! Dime qué ajuste quieres resetear, compadre',

        [`${SUBCOMMANDS_NAME.RESET}.option`]: 'El ajuste, tronco',
        [`${SUBCOMMANDS_NAME.RESET}.option.description`]: '¿Qué configuración quieres resetear, colega?',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_role`]: 'Rol de Verificados',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.verified_18_role`]: 'Rol de Verificados +18',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.welcome_channel`]: 'Canal de Bienvenida',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.auto_nickname`]: 'Apodo Automático',
        [`${SUBCOMMANDS_NAME.RESET}.option.choice.all`]: '¡Todo a la mierda! Todos los ajustes'
    }
});

// =================================================================================================
// Helper Functions
// =================================================================================================

/**
 * Format role mention for display
 * @param {string} roleId - Role ID
 * @param {Guild} guild - Discord guild
 * @returns {string} - Formatted role mention or "Not set"
 */
function formatRole(roleId, guild, locale) {
    if (!roleId) return locale['view.not_set'];
    const role = guild.roles.cache.get(roleId);
    return role ? `<@&${roleId}>` : locale['view.not_set'];
}

/**
 * Format channel mention for display
 * @param {string} channelId - Channel ID
 * @param {Guild} guild - Discord guild
 * @returns {string} - Formatted channel mention or "Not set"
 */
function formatChannel(channelId, guild, locale) {
    if (!channelId) return locale['view.not_set'];
    const channel = guild.channels.cache.get(channelId);
    return channel ? `<#${channelId}>` : locale['view.not_set'];
}

/**
 * Format boolean setting for display
 * @param {string} value - Setting value
 * @param {Object} locale - Localization object
 * @returns {string} - Formatted boolean value
 */
function formatBoolean(value, locale) {
    if (value === 'true') return locale['view.enabled'];
    if (value === 'false') return locale['view.disabled'];
    return locale['view.not_set'];
}

// =================================================================================================
// Command Execution
// =================================================================================================

settingsCommand.setExecute(async ({ interaction, locale, args }) => {
    try {
        await interaction.deferReply();

        const serverId = interaction.guild.id;
        const subcommand = args['subcommand'];

        const settingsExist = await DiscordSettings.exists(serverId);
        if (!settingsExist) {
            const result = DiscordSettings.registerSettings({
                [SUBCOMMANDS_NAME.VERIFICATION_ROLE]: null,
                [SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE]: null,
                [SUBCOMMANDS_NAME.VERIFICATION_CHANNEL]: null,
                [SUBCOMMANDS_NAME.AUTO_NICKNAME]: false
            });

            PrintMessage(`Default settings registered for server: ${interaction.guild.name} - ${JSON.stringify(result)}`);
            return await interaction.editReply({
                content: locale['success.settings_registered'],
                embeds: []
            });
        }

        switch (subcommand) {
            case SUBCOMMANDS_NAME.VERIFICATION_ROLE: {
                const role = args['role'];
                const success = await DiscordSettings.add(serverId, SUBCOMMANDS_NAME.VERIFICATION_ROLE, role.id);
                
                if (success) {
                    await interaction.editReply({
                        content: locale['success.verification_role'].replace('{role}', `<@&${role.id}>`),
                        embeds: []
                    });
                } else {
                    await interaction.editReply({
                        content: locale['error.setting_failed'],
                        embeds: []
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE: {
                const role = args['role'];
                const success = await DiscordSettings.add(serverId, SUBCOMMANDS_NAME.VERIFICATION_PLUS_ROLE, role.id);

                if (success) {
                    await interaction.editReply({
                        content: locale['success.verification_plus_role'].replace('{role}', `<@&${role.id}>`),
                        embeds: []
                    });
                } else {
                    await interaction.editReply({
                        content: locale['error.setting_failed'],
                        embeds: []
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.VERIFICATION_CHANNEL: {
                const channel = args['channel'];
                const success = await DiscordSettings.add(serverId, SUBCOMMANDS_NAME.VERIFICATION_CHANNEL, channel.id);
                
                if (success) {
                    await interaction.editReply({
                        content: locale['success.verification_channel'].replace('{channel}', `<#${channel.id}>`),
                        embeds: []
                    });
                } else {
                    await interaction.editReply({
                        content: locale['error.setting_failed'],
                        embeds: []
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.AUTO_NICKNAME: {
                const enabled = args['enabled'];
                const success = await DiscordSettings.add(serverId, SUBCOMMANDS_NAME.AUTO_NICKNAME, enabled.toString());
                
                if (success) {
                    const status = locale[enabled ? 'status.enabled' : 'status.disabled'];
                    await interaction.editReply({
                        content: locale['success.auto_nickname'].replace('{status}', status),
                        embeds: []
                    });
                } else {
                    await interaction.editReply({
                        content: locale['error.setting_failed'],
                        embeds: []
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.VIEW: {
                const settings = await DiscordSettings.getAll(serverId);
                
                const embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle(locale['view.title'].replace('{serverName}', interaction.guild.name))
                    .setDescription(locale['view.description'])
                    .addFields(
                        {
                            name: locale['view.verified_role'],
                            value: formatRole(settings?.verified_role, interaction.guild, locale),
                            inline: true
                        },
                        {
                            name: locale['view.verified_18_role'],
                            value: formatRole(settings?.verified_18_role, interaction.guild, locale),
                            inline: true
                        },
                        {
                            name: locale['view.auto_nickname'],
                            value: formatBoolean(settings?.auto_nickname, locale),
                            inline: true
                        }
                    )
                    .setTimestamp();

                await interaction.editReply({
                    content: '',
                    embeds: [embed]
                });
                break;
            }

            case SUBCOMMANDS_NAME.RESET: {
                const settingToReset = args['setting'];
                
                if (settingToReset === 'all') {
                    // Reset all settings by getting all and deleting each one
                    const settings = await DiscordSettings.getAll(serverId);
                    if (settings) {
                        const settingKeys = Object.keys(settings);
                        for (const key of settingKeys) {
                            await DiscordSettings.delete(serverId, key);
                        }
                    }
                    
                    await interaction.editReply({
                        content: locale['success.reset_all'],
                        embeds: []
                    });
                } else {
                    const success = await DiscordSettings.delete(serverId, settingToReset);
                    
                    if (success) {
                        await interaction.editReply({
                            content: locale['success.reset'].replace('{setting}', settingToReset),
                            embeds: []
                        });
                    } else {
                        await interaction.editReply({
                            content: locale['error.not_found'],
                            embeds: []
                        });
                    }
                }
                break;
            }
        }

    } catch (error) {
        console.error('Error in settings command:', error);
        await interaction.editReply({
            content: locale['error.general'],
            embeds: []
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([settingsCommand]);