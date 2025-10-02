/**
 * @file        commands/viewprofile.js
 * @author      vicentefelipechile
 * @description Command to view another user's VRChat profile if they are verified.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const GetRandomColor = require("../randomcolor");
const Profile = require("../models/profile");
const { DISCORD_CLIENT_ID } = require("../env");

// =================================================================================================
// Variables
// =================================================================================================

const viewProfileCommand = new ModularCommand('viewprofile')
    .setDescription('View another user\'s VRChat profile.')
    .setCooldown(10);

// Add user option
viewProfileCommand.addOption({
    name: 'user',
    type: ApplicationCommandOptionType.User,
    description: 'The user whose VRChat profile you want to view.',
    required: true,
});

// =================================================================================================
// Localization
// =================================================================================================

viewProfileCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'View another user\'s VRChat profile.',
    [Locale.SpanishLATAM]: 'Ver el perfil de VRChat de otro usuario.',
    [Locale.SpanishES]: 'Para cotillear el perfil de VRChat de otro pavo.',
});

viewProfileCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'title': 'VRChat Profile Viewer',
        'description': 'View another user\'s VRChat profile if they are verified.',
        'error.not_verified_user': 'This user is not verified. They need to link their VRChat account using the `/verification` command first.',
        'error.not_found_user': 'Could not find this user\'s VRChat profile. It may have been deleted or there is an issue with the VRChat API.',
        'error.general': 'An error occurred while trying to retrieve the profile. Please try again later.',
        'error.same_user': 'You cannot view your own profile with this command. Use `/{command}` instead.',
        'error.is_the_bot': 'You cannot view the bot\'s profile. It is personality-less!',
        'embed.title': '{displayName} - VRChat Profile',
        'embed.description': '**Biography**:\n{bio}',
        'embed.status': 'Status:',
        'embed.status.nostatus': 'No status',
        'embed.pronouns': 'Pronouns:',
        'embed.pronouns.nopronouns': 'Not specified',
        'embed.verification_code_detected': 'I noticed that {target} still has the verification code {code} in their VRChat bio. Someone should let them know they can remove it since they are already verified.',
        'success': 'Showing {target}\'s VRChat profile:',
    },
    [Locale.SpanishLATAM]: {
        'title': 'Visor de Perfil de VRChat',
        'description': 'Ver el perfil de VRChat de otro usuario si está verificado.',
        'error.not_verified_user': 'Este usuario no está verificado. Necesita vincular su cuenta de VRChat usando el comando `/verification` primero.',
        'error.not_found_user': 'No se pudo encontrar el perfil de VRChat de este usuario. Puede que haya sido eliminado o que haya un problema con la API de VRChat.',
        'error.general': 'Ocurrió un error al intentar obtener el perfil. Por favor, inténtalo de nuevo más tarde.',
        'error.same_user': 'No puedes ver tu propio perfil con este comando. Usa `/{command}` en su lugar.',
        'error.is_the_bot': 'No puedes ver el perfil del bot. ¡No tiene personalidad!',
        'embed.title': '{displayName} - Perfil de VRChat',
        'embed.description': '**Biografía**:\n{bio}',
        'embed.status': 'Estado:',
        'embed.status.nostatus': 'Sin estado',
        'embed.pronouns': 'Pronombres:',
        'embed.pronouns.nopronouns': 'No especificado',
        'embed.verification_code_detected': 'He notado que {target} aún tiene el código de verificación {code} en su biografía de VRChat. Alguien debería avisarle que puede eliminarlo ya que está verificado.',
        'success': 'Mostrando el perfil de VRChat de {target}:',
    },
    [Locale.SpanishES]: {
        "title": "Cotilleador de Perfiles de VRChat",
        "description": "Para echarle un ojo al perfil de VRChat de otro pavo, siempre y cuando esté verificado.",
        "error.not_verified_user": "¡Eh, para el carro! Este tío no está verificado. Que se vincule la cuenta de VRChat con el comando `/verification` antes de nada.",
        "error.not_found_user": "Pero madre mía Willy, que no encuentro el perfil de este personaje. A lo mejor lo ha borrado o la API de VRChat está haciendo de las suyas.",
        "error.general": "¡Mecachis la mar! Algo ha petado al intentar pillar el perfil. Anda, prueba otra vez en un ratico, ¡a tope con la cope!",
        "error.same_user": "¡Pero hombre! No puedes cotillear tu propio perfil con esto. Para eso usa `/{command}`, ¡no seas melón!",
        "error.is_the_bot": "¡Compañero! ¿Pero cómo vas a ver el perfil del bot? ¡Si no tiene ni media neurona, me cago en la leche!",
        "embed.title": "El Perfil de {displayName} en VRChat",
        "embed.description": "**Su vida y milagros**:\n{bio}",
        "embed.status": "Está:",
        "embed.status.nostatus": "No ha puesto ná",
        "embed.pronouns": "Sus pronombres:",
        "embed.pronouns.nopronouns": "A saber",
        "embed.verification_code_detected": "Oye, que me he fijado que {target} todavía tiene el código de marras {code} en su biografía. Que alguien le dé un toque y le diga que lo quite, que ya está más que verificado.",
        "success": "¡Dale, dale! Aquí tienes el perfil de {target} para que cotillees a gusto, ¡qué fiera, qué máquina!"
    }
});

viewProfileCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'User'
    },
    [Locale.SpanishLATAM]: {
        'user': 'Usuario'
    },
    [Locale.SpanishES]: {
        'user': 'El pibe que deseas espiarle, pero que cojones, madre mia willy'
    }
});

// =================================================================================================
// Custom Execution Logic
// =================================================================================================

// 16 Personalities
const PERSONALITY_URL = 'https://www.16personalities.com/es/personalidad-';
const PERSONALITY_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

function FormatP16(description) {
  let formattedDescription = description;
  for (const type of PERSONALITY_TYPES) {
    const regex = new RegExp(`\\b(${type}(?:-[A-Z])?)\\b`, 'gi');
    if (regex.test(description)) {
      const url = `${PERSONALITY_URL}${type.toLowerCase()}`;
      formattedDescription = formattedDescription.replace(regex, `[$1](${url})`);
    }
  }
  return formattedDescription;
};

// =================================================================================================
// Profile Embed Formatting
// =================================================================================================

function FormatProfileEmbed(vrchatUser, locale) {
  const sanitizedBio = vrchatUser.bio.replace(/([`*_~|\\-])/g, '\\$1');
  const formattedBio = FormatP16(sanitizedBio);

  return new EmbedBuilder()
    .setColor(GetRandomColor())
    .setTitle(vrchatUser.displayName)
    .setURL(`https://vrchat.com/home/user/${vrchatUser.id}`)
    .setDescription(locale['embed.description'].replace('{bio}', formattedBio || 'No biography available'))
    .setImage(vrchatUser.profilePicOverride || vrchatUser.currentAvatarImageUrl)
    .addFields(
      { name: locale['embed.status'], value: vrchatUser.statusDescription || locale['embed.status.nostatus'], inline: true },
      { name: locale['embed.pronouns'], value: vrchatUser.pronouns || locale['embed.pronouns.nopronouns'], inline: true },
    )
    .setFooter({ text: `ID: ${vrchatUser.id}` })
    .setTimestamp(new Date(vrchatUser.date_joined));
}

// =================================================================================================
// Command Execution
// =================================================================================================

viewProfileCommand.setExecute(async ({ interaction, locale, args }) => {
    try {
        await interaction.deferReply();
        
        const targetUser = args['user'];
        const targetId = targetUser.id;

        if (targetId === DISCORD_CLIENT_ID) {
            return await interaction.editReply({
                content: locale['error.same_user'],
                embeds: []
            });
        }

        // Get the target user's profile
        const profile = await Profile.create(targetId);
        const isVerified = await profile.isVerified();

        if (!isVerified) {
            return await interaction.editReply({
                content: locale['error.not_verified_user'],
                embeds: []
            });
        }

        const profileEmbed = FormatProfileEmbed(vrchatUser, locale);
        const code = profile.getVRChatCodeConfirmation();
        let responseMessage = locale['success'].replace('{target}', `<@${targetId}>`);

        // Check if user still has verification code in bio
        if (vrchatUser.bio && code && vrchatUser.bio.includes(code)) {
            const codeMessage = locale['embed.verification_code_detected']
                .replace('{code}', code)
                .replace('{target}', `<@${targetId}>`);
            responseMessage += '\n\n' + codeMessage;
        }

        await interaction.editReply({
            content: responseMessage,
            embeds: [profileEmbed],
        });

    } catch (error) {
        console.error('Error in viewprofile command:', error);
        await interaction.editReply({
            content: locale['error.general'],
            embeds: []
        });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([viewProfileCommand]);