/**
 * @file        commands/adduser.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Admin command to add/link a Discord user with their VRChat profile.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, ApplicationCommandOptionType, EmbedBuilder, Colors } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { D1Class } = require("../d1class");
const { VRCHAT_CLIENT } = require("../vrchat");
const { VERIFICATION_ROLE, AUTO_NICKNAME } = require("../discordsettings");
const { getVRChatId } = require("../util/vrchatcode");

// =================================================================================================
// Variables
// =================================================================================================

const addUserCommand = new ModularCommand('adduser')
    .setDescription('Link a Discord user with their VRChat profile. (Staff Only)')
    .setCooldown(5);

// =================================================================================================
// Command Options
// =================================================================================================

addUserCommand.addOption({
    name: 'user',
    type: ApplicationCommandOptionType.User,
    description: 'The Discord user to link.',
    required: true,
});

addUserCommand.addOption({
    name: 'vrchat_id',
    type: ApplicationCommandOptionType.String,
    description: 'The VRChat user ID (format: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).',
    required: true,
});

// =================================================================================================
// Localization
// =================================================================================================

addUserCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Link a Discord user with their VRChat profile.',
    [Locale.SpanishLATAM]: 'Vincula un usuario de Discord con su perfil de VRChat.',
    [Locale.SpanishES]: 'Tronco, este comando vincula a un pavo de Discord con su perfil de VRChat.',
});

addUserCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'The Discord user to link.',
        'vrchat_id': 'The VRChat user ID (format: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).',
    },
    [Locale.SpanishLATAM]: {
        'user': 'El usuario de Discord a vincular.',
        'vrchat_id': 'El ID de usuario de VRChat (formato: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).',
    },
    [Locale.SpanishES]: {
        'user': 'El pavo de Discord que vas a vincular, colega.',
        'vrchat_id': 'El ID del usuario de VRChat (formato: usr_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX).',
    }
});

addUserCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.invalid_vrchat_id': 'Invalid VRChat ID format. The VRChat ID must have the format: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`',
        'error.profile_exists': 'This VRChat profile is already linked to a Discord account.',
        'error.user_exists': 'This Discord user is already verified with a VRChat account.',
        'error.vrchat_not_found': 'Could not find a VRChat user with the ID `{vrchat_id}`. Please verify the ID is correct.',
        'error.general': 'An error occurred while trying to add the user. Please try again later.',
        'checking_profile': '🔍 Checking if the profile already exists...',
        'fetching_vrchat': '🔍 Fetching VRChat user information...',
        'creating_profile': '📝 Creating new profile...',
        'success.title': '✅ User Added Successfully',
        'success.description': 'The user has been successfully linked to their VRChat profile.',
        'success.field.discord': 'Discord User',
        'success.field.vrchat': 'VRChat User',
        'success.field.vrchat_id': 'VRChat ID',
    },
    [Locale.SpanishLATAM]: {
        'error.invalid_vrchat_id': 'Formato de VRChat ID inválido. El VRChat ID debe tener el formato: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`',
        'error.profile_exists': 'Este perfil de VRChat ya está vinculado a una cuenta de Discord.',
        'error.user_exists': 'Este usuario de Discord ya está verificado con una cuenta de VRChat.',
        'error.vrchat_not_found': 'No se pudo encontrar un usuario de VRChat con el ID `{vrchat_id}`. Por favor, verifica que el ID sea correcto.',
        'error.general': 'Ocurrió un error al intentar agregar el usuario. Por favor, inténtalo de nuevo más tarde.',
        'checking_profile': '🔍 Verificando si el perfil ya existe...',
        'fetching_vrchat': '🔍 Obteniendo información del usuario de VRChat...',
        'creating_profile': '📝 Creando nuevo perfil...',
        'success.title': '✅ Usuario Agregado Exitosamente',
        'success.description': 'El usuario ha sido vinculado exitosamente a su perfil de VRChat.',
        'success.field.discord': 'Usuario de Discord',
        'success.field.vrchat': 'Usuario de VRChat',
        'success.field.vrchat_id': 'ID de VRChat',
    },
    [Locale.SpanishES]: {
        'error.invalid_vrchat_id': '¡Pero mira que eres torpe! El formato del VRChat ID está mal. Tiene que ser: `usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`',
        'error.profile_exists': '¡Anda ya! Este perfil de VRChat ya está pillado por otra cuenta de Discord.',
        'error.user_exists': '¡Oye, que este usuario de Discord ya está verificado con una cuenta de VRChat!',
        'error.vrchat_not_found': '¡Joder! No hay ni dios en VRChat con el ID `{vrchat_id}`. Revisa que lo has puesto bien, anda.',
        'error.general': '¡Ay madre! Algo ha petao al intentar agregar al usuario. Dale un rato y prueba otra vez.',
        'checking_profile': '🔍 Mirando a ver si el perfil ya existe...',
        'fetching_vrchat': '🔍 Pillando la info del usuario de VRChat...',
        'creating_profile': '📝 Creando el perfil nuevo...',
        'success.title': '✅ ¡Usuario Agregado, A Tope!',
        'success.description': 'El pavo este ya está vinculado con su perfil de VRChat, crack.',
        'success.field.discord': 'Usuario de Discord',
        'success.field.vrchat': 'Usuario de VRChat',
        'success.field.vrchat_id': 'ID de VRChat',
    }
});

// =================================================================================================
// Permission Check
// =================================================================================================

addUserCommand.setPermissionCheck(async (interaction) => {
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
// Validation Functions
// =================================================================================================

/**
 * Validates VRChat ID format
 * @param {string} vrchatId - The VRChat ID to validate
 * @returns {boolean} - True if valid VRChat ID
 */
const isValidVRChatId = (vrchatId) => {
    return /^usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(vrchatId);
};

// =================================================================================================
// Command Execution
// =================================================================================================

addUserCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const discordUser = args['user'];
    const vrchatId = args['vrchat_id'];

    const sanitizedVRChatId = getVRChatId(vrchatId);

    // Validate VRChat ID format
    if (!isValidVRChatId(sanitizedVRChatId)) {
        return await interaction.editReply({
            content: locale['error.invalid_vrchat_id']
        });
    }

    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };

    try {
        // Check if the VRChat profile is already linked
        await interaction.editReply({
            content: locale['checking_profile']
        });

        let existingProfile = null;
        try {
            existingProfile = await D1Class.getProfile(userRequestData, sanitizedVRChatId, false);
        } catch (error) {
            // Profile doesn't exist, which is expected for new users
        }

        if (existingProfile) {
            return await interaction.editReply({
                content: locale['error.profile_exists']
            });
        }

        // Check if the Discord user is already verified
        let existingUserProfile = null;
        try {
            existingUserProfile = await D1Class.getProfile(userRequestData, discordUser.id, false);
        } catch (error) {
            // User doesn't have a profile, which is expected
        }

        if (existingUserProfile) {
            return await interaction.editReply({
                content: locale['error.user_exists']
            });
        }

        // Fetch VRChat user information
        await interaction.editReply({
            content: locale['fetching_vrchat']
        });

        const vrchatResponse = await VRCHAT_CLIENT.getUser({
            path: {
                userId: vrchatId
            }
        });

        const vrchatData = vrchatResponse.data;

        if (!vrchatData || !vrchatData.displayName) {
            return await interaction.editReply({
                content: locale['error.vrchat_not_found'].replace('{vrchat_id}', vrchatId)
            });
        }

        // Create new profile
        await interaction.editReply({
            content: locale['creating_profile']
        });

        const profileData = {
            vrchat_id: vrchatId,
            discord_id: discordUser.id,
            vrchat_name: vrchatData.displayName
        };

        await D1Class.createProfile(userRequestData, profileData);

        // Get server settings for auto-role assignment
        const settings = await D1Class.getAllDiscordSettings(userRequestData, interaction.guild.id);

        // Auto-assign verification role if enabled
        const member = await interaction.guild.members.fetch(discordUser.id);
        if (settings[VERIFICATION_ROLE]) {
            const verificationRole = interaction.guild.roles.cache.get(settings[VERIFICATION_ROLE]);
            if (verificationRole) {
                await member.roles.add(verificationRole);
            }
        }

        // Auto-set nickname if enabled
        if (settings[AUTO_NICKNAME] === '1') {
            try {
                await member.setNickname(vrchatData.displayName);
            } catch (error) {
                // Ignore nickname errors (e.g., if user has higher permissions)
            }
        }

        // Success message
        const successEmbed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(locale['success.title'])
            .setDescription(locale['success.description'])
            .addFields(
                { name: locale['success.field.discord'], value: `<@${discordUser.id}>`, inline: true },
                { name: locale['success.field.vrchat'], value: `[${vrchatData.displayName}](https://vrchat.com/home/user/${vrchatId})`, inline: true },
                { name: locale['success.field.vrchat_id'], value: `\`${vrchatId}\``, inline: false }
            )
            .setThumbnail(vrchatData.profilePicOverride || vrchatData.currentAvatarImageUrl)
            .setTimestamp();

        await interaction.editReply({
            content: null,
            embeds: [successEmbed]
        });

    } catch (error) {
        console.error('AddUser command error:', error);
        return await interaction.editReply({
            content: locale['error.general']
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([addUserCommand]);
