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
        'embed.verification_data': 'Verification Data',
        'embed.verification_data.by': 'Verified by <@{discord_id}>',
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
        'embed.verification_data': 'Datos de Verificación',
        'embed.verification_data.by': 'Verificador por <@{discord_id}>',
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
        "embed.verification_data": "Datos de la Verificación, ¡pa que lo sepas!",
        "embed.verification_data.by": "Verificado por el colega <@{discord_id}>",
        "button.verify": "¡A verificar!"
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
        content: localePhraseTarget,
        embeds: [profileEmbed],
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([profileCommand]);