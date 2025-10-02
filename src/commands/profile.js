/**
 * @file        commands/profile.js
 * @author      vicentefelipechile
 * @description Command to display a user's VRChat profile if they are verified.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const GetRandomColor = require("../randomcolor");
const Profile = require("../models/profile");

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
        'button.verify': 'Verify',
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
        'button.verify': 'Verificar',
    },
    [Locale.SpanishES]: {
        "title": "Tu Perfil de VRChat, ¡Olé!",
        "description": "Para que fardes de tu perfil de VRChat, si es que estás verificado, claro.",
        "error.not_verified": "¡Pero chaval, que no estás verificado! Tira del comando `/{command}` para vincular tu cuenta de VRChat o dándole al botón de abajo, ¡a ver si espabilas!",
        "error.not_verified_user": "Este pavo no está verificado. A ver si se ha enterado que tiene que vincular la cuenta con el comando `{command}`.",
        "error.not_found": "¡Me cago en la leche! No hay manera de encontrar tu perfil. O lo has borrado o la API de VRChat está de botellón.",
        "error.not_found_user": "Pero madre mía Willy, que no se encuentra el perfil del colega este. A lo mejor lo ha finiquitado o la API de VRChat está más liada que la pata de un romano.",
        "error.not_allowed": "¡Quieto parao! Que no tienes permiso para andar cotilleando perfiles ajenos.",
        "error.general": "¡Joder! Algo ha salido rana al intentar pillar tu perfil. Prueba en un ratico, ¡a tope con la cope!",
        "embed.title": "El Perfil de {displayName} en VRChat, ¡qué fiera!",
        "embed.description": "**Su vida y milagros, en verso**:\n{bio}",
        "embed.status": "Cómo está el patio:",
        "embed.status.nostatus": "Ni fu, ni fa",
        "embed.pronouns": "Se le conoce como:",
        "embed.pronouns.nopronouns": "A saber, tío",
        "embed.age_verification": "¿Es mayor de edad o qué?:",
        "embed.age_verification.verified": "Verificado, ¡como Dios manda!",
        "embed.age_verification.not_verified": "Nanai de la China",
        "embed.verification_code_detected": "Ojo, que he visto que todavía tienes el código {code} ahí puesto en la biografía. ¡Que no hace falta que lo dejes una vez verificado, melón!",
        "embed.verification_code_detected.target": "¡Al loro! Que {target} todavía tiene el código {code} en su biografía. Que alguien le dé un toque y le diga que lo borre, que una vez verificado ya no pinta nada ahí.",
        "button.verify": "¡A verificar!"
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
    const isTargetingAUser = args['usuario'] && args['usuario'].id !== interaction.user.id;
    const targetId = isTargetingAUser ? args['usuario'].id : interaction.user.id;

    if (isTargetingAUser && !interaction.member.permissions.has('ModerateMembers')) {
        return await interaction.editReply({
            content: locale['error.not_allowed'],
            embeds: []
        });
    }

    const profile = await Profile.create(targetId);
    const isVerified = await profile.isVerified();

    if (!isVerified) {
        const verificationButton = new ButtonBuilder()
            .setLabel(locale['button.verify'])
            .setStyle(ButtonStyle.Primary)
            .setCustomId('verification_profile');
        
        return await interaction.editReply({
            content: locale['error.not_verified'].replace('{command}', command.name),
            components: [new ActionRowBuilder().addComponents(verificationButton)],
        });
    }

    const vrchatUser = profile.getVRChatData();

    const profileEmbed = FormatProfileEmbed(vrchatUser, locale);
    const code = profile.getVRChatCodeConfirmation();
    let localePhraseTarget = null;

    if (vrchatUser.bio.includes(code)) {
        localePhraseTarget = locale['embed.verification_code_detected' + (isTargetingAUser ? '.target' : '')]
            .replace('{code}', code)
            .replace('{target}', isTargetingAUser ? `<@${targetId}>` : 'tu');
    }

    await interaction.editReply({
        content: localePhraseTarget,
        embeds: [profileEmbed],
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([profileCommand]);