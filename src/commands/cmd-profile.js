/**
 * @file        cmd-profile.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to display a user's VRChat profile if they are verified.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { GetUserByDiscord, UserExists, GenerateCodeByVRChat } = require("../profile");
const { GetUserById } = require("../vrchat");
const GetRandomColor = require("../randomcolor");

// =================================================================================================
// Variables
// =================================================================================================

const profileCommand = new ModularCommand('profile')
    .setDescription('Display your profile information.')
    .setCooldown(15)

// =================================================================================================
// Localization
// =================================================================================================

profileCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Display your profile information.',
    [Locale.SpanishLATAM]: 'Muestra la información de tu perfil.',
});

profileCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'title': 'VRChat Profile',
        'description': 'Displays your VRChat profile if you are verified.',
        'error.not_verified': 'You are not verified. Please use the `{command}` command to link your VRChat account.',
        'error.not_verified_user': 'This user is not verified. Make sure they have linked their VRChat account using the `{command}` command.',
        'error.not_found': 'Could not find your VRChat profile. It may have been deleted or there is an issue with the VRChat API.',
        'error.not_found_user': 'Could not find the specified VRChat profile. It may have been deleted or there is an issue with the VRChat API.',
        'error.not_allowed': 'You do not have permission to view another user\'s profile.',
        'error.general': 'An error occurred while trying to retrieve your profile. Please try again later.',
        'embed.title': '{displayName} - VRChat Profile',
        'embed.description': '**Biography**:\n{bio}',
        'embed.status': 'Status:',
        'embed.status.nostatus': 'No status',
        'embed.pronouns': 'Pronouns:',
        'embed.pronouns.nopronouns': 'Not specified',
        'embed.age_verification': 'Age Verification: {ageVerification}',
        'embed.age_verification.verified': 'Verified',
        'embed.age_verification.not_verified': 'Not Verified',
        'embed.verification_code_detected': 'I noticed that you still have the code {code} in your VRChat bio. Once you are verified, it is not necessary to keep it.',
        'embed.verification_code_detected.target': 'I noticed that {target} still has the code {code} in their VRChat bio. Someone should let them know to remove it since it is not necessary to keep it once verified.',
    },
    [Locale.SpanishLATAM]: {
        'title': 'Perfil de VRChat',
        'description': 'Muestra tu perfil de VRChat si estás verificado.',
        'error.not_verified': 'No estás verificado. Por favor, usa el comando `{command}` para vincular tu cuenta de VRChat.',
        'error.not_verified_user': 'Este usuario no está verificado. Asegúrate de que haya vinculado su cuenta de VRChat usando el comando `{command}`.',
        'error.not_found': 'No se pudo encontrar tu perfil de VRChat. Puede que haya sido eliminado o que haya un problema con la API de VRChat.',
        'error.not_found_user': 'No se pudo encontrar el perfil de VRChat especificado. Puede que haya sido eliminado o que haya un problema con la API de VRChat.',
        'error.not_allowed': 'No tienes permiso para ver el perfil de otro usuario.',
        'error.general': 'Ocurrió un error al intentar obtener tu perfil. Por favor, inténtalo de nuevo más tarde.',
        'embed.title': '{displayName} - Perfil de VRChat',
        'embed.description': '**Biografía**:\n{bio}',
        'embed.status': 'Estado:',
        'embed.status.nostatus': 'Sin estado',
        'embed.pronouns': 'Pronombres:',
        'embed.pronouns.nopronouns': 'No especificado',
        'embed.age_verification': 'Verificación de Edad:',
        'embed.age_verification.verified': 'Verificado',
        'embed.age_verification.not_verified': 'No Verificado',
        'embed.verification_code_detected': 'He notado que aún tienes el código {code} en tu biografía de VRChat. Una vez verificado no hace falta mantenerlo.',
        'embed.verification_code_detected.target': 'He notado que {target} aún tiene el código {code} en su biografía de VRChat. Que alguien le avise que lo elimine ya que una vez verificado no hace falta mantenerlo-',
    }
});

profileCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'user': 'User'
    },
    [Locale.SpanishLATAM]: {
        'user': 'Usuario'
    }
})

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
  // const ageVerified = locale['embed.age_verification.' + (vrchatUser.ageVerified ? 'verified' : 'not_verified')];

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

profileCommand.setExecute(async ({ interaction, locale, args, command }) => {
    await interaction.deferReply();

    if (!UserExists(interaction.user.id)) {
        return await interaction.reply(locale['error.not_verified'].replace('{command}', command.name));
    }

    const userData = await GetUserByDiscord(interaction.user.id);
    const vrchatUser = await GetUserById(userData.vrchat_id);

    const profileEmbed = FormatProfileEmbed(vrchatUser, locale);
    const code = GenerateCodeByVRChat(userData.vrchat_id);

    if (vrchatUser.bio.includes(code)) {
        await interaction.editReply({
        content: locale[`embed.verification_code_detected${isTargetingAUser ? '.target' : ''}`]
            .replace('{code}', code)
            .replace('{target}', isTargetingAUser ? `<@${args['usuario'].id}>` : 'tu'),
        embeds: [profileEmbed],
        });
    } else {
        await interaction.editReply({ embeds: [profileEmbed] });
    }
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([profileCommand]);