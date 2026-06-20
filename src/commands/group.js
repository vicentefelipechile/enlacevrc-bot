/**
 * @file        commands/group.js
 * @author      vicentefelipechile
 * @description Command to manage VRChat group actions through Discord.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { Locale, EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits, Colors, MessageFlags } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { D1Class } = require("../d1class");
const { VRCHAT_CLIENT } = require("../vrchat");

// =================================================================================================
// Variables
// =================================================================================================

/**
 * @typedef {Object} VRChatPermission
 * @property {boolean} allowedToAdd - Whether this permission can be added to roles
 * @property {string} displayName - Human-readable name of the permission
 * @property {string} help - Description of what this permission allows
 * @property {boolean} isManagementPermission - Whether this is a management-level permission
 * @property {string} name - Internal permission identifier (e.g., 'group-members-manage')
 * @property {string[]} [dependsOn] - Optional array of permission names this permission depends on
 */

/**
 * @type {VRChatPermission[]}
 */
const PERMISSIONS_DATA = require("../data/permissions.json");
const PERMISSIONS_NAME = {};
for (const permission of PERMISSIONS_DATA) {
    PERMISSIONS_NAME[permission.name] = permission.displayName;
}

const groupCommand = new ModularCommand('group')
    .setDescription('Manage VRChat group actions.')
    .setCooldown(5);

const SUBCOMMANDS_NAME = {
    INVITE: 'invite',
    KICK: 'kick',
    VIEWPERMISSIONS: 'viewpermissions'
};

const PERMISSIONS = {
    INVITE: 'group-invites-manage',
    KICK: 'group-members-remove'
};

// =================================================================================================
// Permissions
// =================================================================================================

groupCommand.setPermissionCheck(async (interaction) => {
    const member = interaction.member;
    if (!member || !member.permissions) {
        return false;
    }

    // Check if user has administrator permissions
    return member.permissions.has(PermissionFlagsBits.Administrator);
});

// =================================================================================================
// Subcommands
// =================================================================================================

groupCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.INVITE,
    description: 'Invite a user to the VRChat group',
    options: [
        {
            name: 'group',
            description: 'The VRChat group ID',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'user',
            description: 'User to invite',
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ]
});

groupCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.KICK,
    description: 'Kick a user from the VRChat group',
    options: [
        {
            name: 'group',
            description: 'The VRChat group ID',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'user',
            description: 'User to kick',
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ]
});

groupCommand.addSubCommand({
    name: SUBCOMMANDS_NAME.VIEWPERMISSIONS,
    description: 'View the bot\'s current permissions in the VRChat group',
    options: [
        {
            name: 'group',
            description: 'The VRChat group ID',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ]
});

// =================================================================================================
// Localization
// =================================================================================================

groupCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Manage VRChat group actions.',
    [Locale.SpanishLATAM]: 'Administra acciones del grupo de VRChat.',
    [Locale.SpanishES]: 'Administra tu grupo de VRChat, tronco.',
});

groupCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.permission': 'You need the "Administrator" permission to use this command.',
        'error.general': 'An error occurred while processing the request. Please try again later.',
        'error.not_linked': 'You need to link your VRChat account first. Use `/verification` to get started.',
        'error.group_not_linked': 'The VRChat group "{groupId}" is not linked to this Discord server. Use `/linkgroup` to link it first.',
        'error.no_permission': 'The bot does not have the necessary permissions to perform this action in the VRChat group.',
        'error.user_not_found': 'The user "{username}" was not found on VRChat.',
        'error.invite_failed': 'Failed to invite the user to the group.',
        'error.kick_failed': 'Failed to kick the user from the group.',
        'success.invite': '✅ Successfully invited **{username}** to the group **{groupName}**.',
        'success.kick': '✅ Successfully kicked **{username}** from the group **{groupName}**.',
        'permissions.title': '🔐 Bot Permissions in {groupName}',
        'permissions.available': '## ✅ Available permissions:',
        'permissions.missing': '## ❌ Missing permissions:',
        'permissions.none': '_None_',
        'permissions.invite': '`/group invite`: `group-invites-manage`',
        'permissions.kick': '`/group kick`: `group-members-remove`',
    },
    [Locale.SpanishLATAM]: {
        'error.permission': 'Necesitas el permiso de "Administrador" para usar este comando.',
        'error.general': 'Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.',
        'error.not_linked': 'Primero necesitas vincular tu cuenta de VRChat. Usa `/verification` para comenzar.',
        'error.group_not_linked': 'El grupo de VRChat "{groupId}" no está vinculado a este servidor de Discord. Usa `/linkgroup` para vincularlo primero.',
        'error.no_permission': 'El bot no tiene los permisos necesarios para realizar esta acción en el grupo de VRChat.',
        'error.user_not_found': 'El usuario "{username}" no fue encontrado en VRChat.',
        'error.invite_failed': 'No se pudo invitar al usuario al grupo.',
        'error.kick_failed': 'No se pudo expulsar al usuario del grupo.',
        'success.invite': '✅ Se invitó exitosamente a **{username}** al grupo **{groupName}**.',
        'success.kick': '✅ Se expulsó exitosamente a **{username}** del grupo **{groupName}**.',
        'permissions.title': '🔐 Permisos del Bot en {groupName}',
        'permissions.available': '## ✅ Permisos disponibles:',
        'permissions.missing': '## ❌ Permisos faltantes:',
        'permissions.none': '_Ninguno_',
        'permissions.invite': '`/group invite`: `group-invites-manage`',
        'permissions.kick': '`/group kick`: `group-members-remove`',
    },
    [Locale.SpanishES]: {
        'error.permission': '¡A ver, tronco! Necesitas el permiso de "Administrador" para usar este comando.',
        'error.general': '¡Madre mía! Algo ha fallado al procesar la petición. Prueba otra vez más tarde, colega.',
        'error.not_linked': 'Primero tienes que vincular tu cuenta de VRChat, chaval. Usa `/verification` para empezar.',
        'error.group_not_linked': 'El grupo de VRChat "{groupId}" no está vinculado a este server de Discord. Usa `/linkgroup` para vincularlo primero, figura.',
        'error.no_permission': '¡Nanay! El bot no tiene los permisos necesarios para hacer esto en el grupo de VRChat.',
        'error.user_not_found': 'El usuario "{username}" no se encuentra en VRChat, macho.',
        'error.invite_failed': '¡Joder! No se ha podido invitar al usuario al grupo.',
        'error.kick_failed': '¡Me cago en diez! No se ha podido expulsar al usuario del grupo.',
        'success.invite': '✅ ¡De lujo! Se ha invitado a **{username}** al grupo **{groupName}**, como Dios manda.',
        'success.kick': '✅ ¡Hecho! Se ha expulsado a **{username}** del grupo **{groupName}**, tronco.',
        'permissions.title': '🔐 Permisos del Bot en {groupName}',
        'permissions.available': '## ✅ Permisos disponibles:',
        'permissions.missing': '## ❌ Permisos faltantes:',
        'permissions.none': '_Ninguno_',
        'permissions.invite': '`/group invite`: `group-invites-manage`',
        'permissions.kick': '`/group kick`: `group-members-remove`',
    }
});

groupCommand.setLocalizationSubCommands({
    [Locale.EnglishUS]: {
        [`${SUBCOMMANDS_NAME.INVITE}`]: 'Invite User',
        [`${SUBCOMMANDS_NAME.INVITE}.description`]: 'Invite a user to the VRChat group',
        [`${SUBCOMMANDS_NAME.INVITE}.group`]: 'Group ID',
        [`${SUBCOMMANDS_NAME.INVITE}.group.description`]: 'The VRChat group ID',
        [`${SUBCOMMANDS_NAME.INVITE}.user`]: 'User',
        [`${SUBCOMMANDS_NAME.INVITE}.user.description`]: 'VRChat username or user ID to invite',

        [`${SUBCOMMANDS_NAME.KICK}`]: 'Kick User',
        [`${SUBCOMMANDS_NAME.KICK}.description`]: 'Kick a user from the VRChat group',
        [`${SUBCOMMANDS_NAME.KICK}.group`]: 'Group ID',
        [`${SUBCOMMANDS_NAME.KICK}.group.description`]: 'The VRChat group ID',
        [`${SUBCOMMANDS_NAME.KICK}.user`]: 'User',
        [`${SUBCOMMANDS_NAME.KICK}.user.description`]: 'VRChat username or user ID to kick',

        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}`]: 'View Permissions',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.description`]: 'View the bot\'s current permissions in the VRChat group',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group`]: 'Group ID',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group.description`]: 'The VRChat group ID',
    },
    [Locale.SpanishLATAM]: {
        [`${SUBCOMMANDS_NAME.INVITE}`]: 'Invitar Usuario',
        [`${SUBCOMMANDS_NAME.INVITE}.description`]: 'Invita un usuario al grupo de VRChat',
        [`${SUBCOMMANDS_NAME.INVITE}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.INVITE}.group.description`]: 'El ID del grupo de VRChat',
        [`${SUBCOMMANDS_NAME.INVITE}.user`]: 'Usuario',
        [`${SUBCOMMANDS_NAME.INVITE}.user.description`]: 'Nombre de usuario o ID de VRChat a invitar',

        [`${SUBCOMMANDS_NAME.KICK}`]: 'Expulsar Usuario',
        [`${SUBCOMMANDS_NAME.KICK}.description`]: 'Expulsa un usuario del grupo de VRChat',
        [`${SUBCOMMANDS_NAME.KICK}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.KICK}.group.description`]: 'El ID del grupo de VRChat',
        [`${SUBCOMMANDS_NAME.KICK}.user`]: 'Usuario',
        [`${SUBCOMMANDS_NAME.KICK}.user.description`]: 'Nombre de usuario o ID de VRChat a expulsar',

        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}`]: 'Ver Permisos',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.description`]: 'Ver los permisos actuales del bot en el grupo de VRChat',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group.description`]: 'El ID del grupo de VRChat',
    },
    [Locale.SpanishES]: {
        [`${SUBCOMMANDS_NAME.INVITE}`]: 'Invitar Usuario',
        [`${SUBCOMMANDS_NAME.INVITE}.description`]: 'Invita a un usuario al grupo de VRChat, tronco',
        [`${SUBCOMMANDS_NAME.INVITE}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.INVITE}.group.description`]: 'El ID del grupo de VRChat',
        [`${SUBCOMMANDS_NAME.INVITE}.user`]: 'Usuario',
        [`${SUBCOMMANDS_NAME.INVITE}.user.description`]: 'Nombre de usuario o ID de VRChat a invitar',

        [`${SUBCOMMANDS_NAME.KICK}`]: 'Echar Usuario',
        [`${SUBCOMMANDS_NAME.KICK}.description`]: 'Echa a un usuario del grupo de VRChat, macho',
        [`${SUBCOMMANDS_NAME.KICK}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.KICK}.group.description`]: 'El ID del grupo de VRChat',
        [`${SUBCOMMANDS_NAME.KICK}.user`]: 'Usuario',
        [`${SUBCOMMANDS_NAME.KICK}.user.description`]: 'Nombre de usuario o ID de VRChat a echar',

        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}`]: 'Ver Permisos',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.description`]: 'Ver los permisos del bot en el grupo de VRChat',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group`]: 'ID del Grupo',
        [`${SUBCOMMANDS_NAME.VIEWPERMISSIONS}.group.description`]: 'El ID del grupo de VRChat',
    }
});

// =================================================================================================
// Helper Functions
// =================================================================================================

/**
 * Verifies if the group is linked to the Discord server
 * @param {string} groupId - VRChat group ID
 * @param {string} serverId - Discord server ID
 * @param {Object} userRequestData - User request data
 * @returns {Promise<boolean>} - True if linked, false otherwise
 */
async function isGroupLinked(groupId, serverId, userRequestData) {
    try {
        // Get the Discord server linked to the VRChat group
        const serverData = await D1Class.getVRChatGroupServer(userRequestData, groupId);

        // Verify the server ID matches
        return serverData && serverData.discord_server_id === serverId;
    } catch (error) {
        return false;
    }
}

/**
 * Resolves a username or user ID to a VRChat user ID
 * @param {string} userInput - Username or user ID
 * @returns {Promise<{id: string, displayName: string}>} - User ID and display name
 */
async function resolveUser(userInput) {
    // If it starts with "usr_", it's already a user ID
    if (userInput.startsWith('usr_')) {
        const userResponse = await VRCHAT_CLIENT.getUser({
            path: { userId: userInput }
        });
        return {
            id: userResponse.data.id,
            displayName: userResponse.data.displayName
        };
    }

    // Otherwise, search for the user by username
    const searchResponse = await VRCHAT_CLIENT.searchUsers({
        query: { search: userInput, n: 1 }
    });

    if (!searchResponse.data || searchResponse.data.length === 0) {
        throw new Error('User not found');
    }

    return {
        id: searchResponse.data[0].id,
        displayName: searchResponse.data[0].displayName
    };
}

// =================================================================================================
// Command Execution
// =================================================================================================

groupCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const serverId = interaction.guild.id;
    const subcommand = args['subcommand'];
    const groupId = args['group'];

    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username,
    };

    try {
        // Verify user is linked to VRChat
        let profileData = null;
        try {
            profileData = await D1Class.getProfile(userRequestData, interaction.user.id, false);
        } catch (error) {
            return interaction.editReply({
                content: locale['error.not_linked'],
                flags: MessageFlags.SuppressNotifications
            });
        }

        if (!profileData || !profileData.vrchat_id) {
            return interaction.editReply({
                content: locale['error.not_linked'],
                flags: MessageFlags.SuppressNotifications
            });
        }

        // Verify group is linked to this Discord server
        const linked = await isGroupLinked(groupId, serverId, userRequestData);
        if (!linked) {
            return interaction.editReply({
                content: locale['error.group_not_linked'].replace('{groupId}', groupId),
                flags: MessageFlags.SuppressNotifications
            });
        }

        // Get group information
        const groupResponse = await VRCHAT_CLIENT.getGroup({
            path: { groupId }
        });
        const groupData = groupResponse.data;

        switch (subcommand) {
            case SUBCOMMANDS_NAME.INVITE: {
                const userInput = args['user'];

                // Check if bot has the required permission
                if (!groupData.myMember.permissions.includes('group-invites-manage')) {
                    return interaction.editReply({
                        content: locale['error.no_permission'],
                        flags: MessageFlags.SuppressNotifications
                    });
                }

                try {
                    // Resolve user
                    const targetUser = await resolveUser(userInput);

                    // Invite user to group
                    await VRCHAT_CLIENT.inviteGroupMember({
                        path: {
                            groupId,
                            userId: targetUser.id
                        }
                    });

                    await interaction.editReply({
                        content: locale['success.invite']
                            .replace('{username}', targetUser.displayName)
                            .replace('{groupName}', groupData.name),
                        flags: MessageFlags.SuppressNotifications
                    });
                } catch (error) {
                    if (error.message === 'User not found') {
                        return interaction.editReply({
                            content: locale['error.user_not_found'].replace('{username}', userInput),
                            flags: MessageFlags.SuppressNotifications
                        });
                    }
                    console.error('Error inviting user to group:', error);
                    return interaction.editReply({
                        content: locale['error.invite_failed'],
                        flags: MessageFlags.SuppressNotifications
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.KICK: {
                const userInput = args['user'];

                // Check if bot has the required permission
                if (!groupData.myMember.permissions.includes('group-members-remove')) {
                    return interaction.editReply({
                        content: locale['error.no_permission'],
                        flags: MessageFlags.SuppressNotifications
                    });
                }

                try {
                    // Resolve user
                    const targetUser = await resolveUser(userInput);

                    // Kick user from group
                    await VRCHAT_CLIENT.removeGroupMember({
                        path: {
                            groupId,
                            userId: targetUser.id
                        }
                    });

                    await interaction.editReply({
                        content: locale['success.kick']
                            .replace('{username}', targetUser.displayName)
                            .replace('{groupName}', groupData.name),
                        flags: MessageFlags.SuppressNotifications
                    });
                } catch (error) {
                    if (error.message === 'User not found') {
                        return interaction.editReply({
                            content: locale['error.user_not_found'].replace('{username}', userInput),
                            flags: MessageFlags.SuppressNotifications
                        });
                    }
                    console.error('Error kicking user from group:', error);
                    return interaction.editReply({
                        content: locale['error.kick_failed'],
                        flags: MessageFlags.SuppressNotifications
                    });
                }
                break;
            }

            case SUBCOMMANDS_NAME.VIEWPERMISSIONS: {
                const hasPermission = {
                    invite: groupData.myMember.permissions.includes(PERMISSIONS.INVITE),
                    kick: groupData.myMember.permissions.includes(PERMISSIONS.KICK)
                };

                // Build available permissions list
                const availablePermissions = [];
                if (hasPermission.invite) availablePermissions.push('- ' + locale['permissions.invite']);
                if (hasPermission.kick) availablePermissions.push('- ' + locale['permissions.kick']);

                // Build missing permissions list
                const missingPermissions = [];
                if (!hasPermission.invite) missingPermissions.push('- ' + locale['permissions.invite']);
                if (!hasPermission.kick) missingPermissions.push('- ' + locale['permissions.kick']);

                // Build the description
                let phrase = locale['permissions.available'] + '\n';
                phrase += availablePermissions.length > 0 ? availablePermissions.join('\n') : locale['permissions.none'];
                phrase += '\n\n';
                phrase += locale['permissions.missing'] + '\n';
                phrase += missingPermissions.length > 0 ? missingPermissions.join('\n') : locale['permissions.none'];

                // Create embed with permissions
                const permissionsEmbed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle(locale['permissions.title'].replace('{groupName}', groupData.name))
                    .setDescription(phrase)
                    .setTimestamp()
                    .setFooter({
                        text: `Group ID: ${groupId}`,
                        iconURL: interaction.guild.iconURL()
                    });

                if (groupData.iconUrl) {
                    permissionsEmbed.setThumbnail(groupData.iconUrl);
                }

                await interaction.editReply({
                    embeds: [permissionsEmbed],
                    flags: MessageFlags.SuppressNotifications
                });
                break;
            }
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: locale['error.general'],
            flags: MessageFlags.SuppressNotifications
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([groupCommand]);
