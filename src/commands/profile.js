/**
 * @file        commands/profile.js
 * @author      vicentefelipechile
 * @description Command to display a user's VRChat profile if they are verified.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const GetRandomColor = require("../randomcolor");
const { D1Class } = require("../d1class");
const { VRCHAT_CLIENT } = require("../vrchat");
const { generateCodeByVRChat } = require("../util/vrchatcode");
const { FormatProfileEmbed } = require("../util/profile");

// =================================================================================================
// Variables
// =================================================================================================

const profileCommand = new ModularCommand('profile')
    .setDescription('Display your profile information.')
    .setCooldown(15);

// =================================================================================================
// Localization
// =================================================================================================

profileCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Display your profile information.',
    [Locale.SpanishLATAM]: 'Muestra la información de tu perfil.',
    [Locale.SpanishES]: 'Chaval, este comando te muestra la info de tu perfil, que eres un cotilla.',
});

profileCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'title': 'VRChat Profile',
        'description': 'Displays your VRChat profile if you are verified.',
        'error.not_verified': 'You are not verified. Please use the `/{command}` command to link your VRChat account or press the button below to start the verification process.',
        'error.not_verified_user': 'This user is not verified. Make sure they have linked their VRChat account using the `{command}` command.',
        'error.not_found': 'Could not find your VRChat profile. It may have been deleted or there is an issue with the VRChat API.',
        'error.not_found_user': 'Could not find the specified VRChat profile. It may have been deleted or there is an issue with the VRChat API.',
        'error.not_allowed': 'You do not have permission to view another user\'s profile.',
        'error.general': 'An error occurred while trying to retrieve your profile. Please try again later.',
        'button.verify': 'Verify',
        'button.view_profile': 'View Profile',
        'button.view_personality': 'View Personality',
        'embed.nostatus': 'No status',
        'embed.nopronouns': 'Not specified',
        'embed.verification_code_detected': 'I noticed that you still have the code {code} in your VRChat biography. Once verified, there is no need to keep it there.',
        'embed.verification_by': 'Verified by <@{discord_id}>',
        'embed.banned_by': 'Banned by <@{banned_by}>\nRazon: **{banned_reason}**\nBanned at {banned_at}',
        'embed.body':
            `# [{profile_name}]({profile_url})` +
            `\n` +
            `\n## Biography` +
            `\n` +
            `\n{profile_bio}` +
            `\n` +
            `\n**Status**: {profile_status}` +
            `\n**Pronouns**: {profile_wokestuff}`,
    },
    [Locale.SpanishLATAM]: {
        'title': 'Perfil de VRChat',
        'description': 'Muestra tu perfil de VRChat si estás verificado.',
        'error.not_verified': 'No estás verificado. Por favor, usa el comando `/{command}` para vincular tu cuenta de VRChat o presiona el botón de abajo para iniciar el proceso de verificación.',
        'error.not_verified_user': 'Este usuario no está verificado. Asegúrate de que haya vinculado su cuenta de VRChat usando el comando `{command}`.',
        'error.not_found': 'No se pudo encontrar tu perfil de VRChat. Puede que haya sido eliminado o que haya un problema con la API de VRChat.',
        'error.not_found_user': 'No se pudo encontrar el perfil de VRChat especificado. Puede que haya sido eliminado o que haya un problema con la API de VRChat.',
        'error.not_allowed': 'No tienes permiso para ver el perfil de otro usuario.',
        'error.general': 'Ocurrió un error al intentar obtener tu perfil. Por favor, inténtalo de nuevo más tarde.',
        'button.verify': 'Verificar',
        'button.view_profile': 'Ver perfil',
        'button.view_personality': 'Ver personalidad',
        'embed.nostatus': 'Sin estado',
        'embed.nopronouns': 'No especificado',
        'embed.verification_code_detected': 'He notado que aún tienes el código {code} en tu biografía de VRChat. Una vez verificado no hace falta mantenerlo.',
        'embed.verification_by': 'Verificador por <@{discord_id}>',
        'embed.banned_by': 'Baneado por <@{banned_by}>\nRazon: **{banned_reason}**\nBaneado el {banned_at}',
        'embed.body':
            `# [{profile_name}]({profile_url})` +
            `\n` +
            `\n## Biografia` +
            `\n` +
            `\n{profile_bio}` +
            `\n` +
            `\n**Estado**: {profile_status}` +
            `\n**Pronombres**: {profile_wokestuff}`,
    },
    [Locale.SpanishES]: {
        'title': '¡Tú Perfil de VRChat, Tío!',
        'description': '¡Anda, que te voy a enseñar tu perfil de VRChat, pero si estás verificado, claro, que no vales ni pa eso!',
        'error.not_verified': '¡Madre mía Willy! ¡Que no estás verificao, chaval! Tira pa lante con el comando `/{command}` para vincular tu cuenta o dale al botón de abajo, ¡que vales menos que un chicle mascao!',
        'error.not_verified_user': '¡Ostras! Este tío no está verificao. Que se entere el pobrecillo que tiene que vincular la cuenta de VRChat con el comando `{command}`, ¡anda ya!',
        'error.not_found': '¡Me cago en la mar, colega! No hay forma de encontrar tu perfil de VRChat. O lo has borrao o la API está más tumbao que un jamón serrano en agosto.',
        'error.not_found_user': '¡Joder, tío! El perfil del compa este desapareció como hormigas en la despensa. A lo mejor lo vaporizo o la API de VRChat está tocá de la azotea, vaya usted a saber.',
        'error.not_allowed': '¡Ey, quieto parao! Que no puedes andar cotilleando los perfiles ajenos como si fueras Marife de Triana, mira que eres soplón.',
        'error.general': '¡Ay, que desastre! Se ha torcido algo bien feo al buscar tu perfil. Déjalo un ratillo y vuelta a intentá, verás como sale de la primera.',
        'button.verify': 'Verificar',
        'button.view_profile': 'Ver perfil',
        'button.view_personality': 'Ver personalidad',
        'embed.nostatus': 'Sin estado',
        'embed.nopronouns': 'No especificao',
        'embed.verification_code_detected': '¡Oye, mira que eres lerdo! Que aún llevas el código {code} en la biografía de VRChat. Una vez verificao, quítate eso del medio, que ocupa.',
        'embed.verification_by': 'Verificao por <@{discord_id}>',
        'embed.banned_by': 'Baneado por <@{banned_by}>\nRazon: **{banned_reason}**\nBaneado el {banned_at}',
        'embed.body':
            `# [{profile_name}]({profile_url})` +
            `\n` +
            `\n## La flipante vida del colega` +
            `\n` +
            `\n{profile_bio}` +
            `\n` +
            `\n**Estado**: {profile_status}` +
            `\n**Pronombres**: {profile_wokestuff}`,
    }
});

profileCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'User'
    },
    [Locale.SpanishLATAM]: {
        'user': 'Usuario'
    },
    [Locale.SpanishES]: {
        'user': 'El colega'
    }
})

// =================================================================================================
// Command Execution
// =================================================================================================

profileCommand.setExecute(async ({ interaction, locale, command }) => {
    await interaction.deferReply();

    let profileData = null;

    try {
        profileData = await D1Class.getProfile({
            discord_id: interaction.user.id,
            discord_name: interaction.user.username
        }, interaction.user.id);
    } catch (error) {
        const verificationButton = new ButtonBuilder()
            .setLabel(locale['button.verify'])
            .setStyle(ButtonStyle.Primary)
            .setCustomId('verification_profile');

        return await interaction.editReply({
            content: locale['error.not_verified'].replace('{command}', command.name),
            components: [new ActionRowBuilder().addComponents(verificationButton)],
        });
    }

    const vrchatResponse = await VRCHAT_CLIENT.getUser({
        path: {
            userId: profileData.vrchat_id,
        }
    });
    const vrchatData = vrchatResponse.data;

    const profileEmbed = FormatProfileEmbed(vrchatData, profileData, locale);
    const code = generateCodeByVRChat(vrchatData.id);
    let localePhraseTarget = null;

    if (vrchatData.bio.includes(code)) {
        localePhraseTarget = locale['embed.verification_code_detected']
            .replace('{code}', code);
    }

    await interaction.editReply({
        // content: localePhraseTarget,
        components: [profileEmbed],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([profileCommand]);