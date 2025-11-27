/**
 * @file        commands/verification.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to allow a user to verify their Discord account with their VRChat profile.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, Colors, AttachmentBuilder, ApplicationCommandOptionType, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const NodeCache = require("node-cache");
const DISCORD_SERVER_SETTINGS = require("../discordsettings");
const { D1Class } = require("../d1class");
const { generateCodeByVRChat, getVRChatId } = require("../util/vrchatcode");
const { VRCHAT_CLIENT } = require("../vrchat");

// =================================================================================================
// Variables
// =================================================================================================

const verificationCommand = new ModularCommand('verification')
    .setDescription('Verify your account by linking it to your VRChat profile.')
    .setCooldown(10)

verificationCommand.addOption({
    name: 'vrchat',
    type: ApplicationCommandOptionType.String,
    description: 'Your VRChat profile URL.',
    required: false,
})

const commandVerifyVideo = new AttachmentBuilder('img/verify.webm', { name: 'verify.webm' });

const VRCHAT_URL = 'https://vrchat.com/home';
const VRCHAT_CODE_VERIFY_DATA = new NodeCache({ stdTTL: 5 * 60 });

// =================================================================================================
// Localization
// =================================================================================================

verificationCommand.setLocalizationOptions({
    [Locale.EnglishUS]: {
        'vrchat': 'Your VRChat profile URL.',
    },
    [Locale.SpanishLATAM]: {
        'vrchat': 'Tu URL al perfil de VRChat.',
    },
    [Locale.SpanishES]: {
        'vrchat': 'Pero willy, pon aquí la URL de tu perfil de VRChat, tronco. Que no se te olvide, ¿eh?',
    }
})

verificationCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Verify your account by linking it to your VRChat profile.',
    [Locale.SpanishLATAM]: 'Verifica tu cuenta vinculándola con tu perfil de VRChat.',
    [Locale.SpanishES]: 'Verifica tu cuenta, que esto es más fácil que freír un huevo, tronco.',
});

verificationCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.already_verified': 'You are already verified.',
        'error.banned': 'You are banned and cannot be verified.',
        'error.banned_unverify': 'You are banned and cannot unverify your account.',
        'error.generic': 'An unexpected error occurred. Please try again later.',
        'error.timeout': 'Verification timed out. Please run the command again.',
        'error.code_not_found': 'The verification code was not found in your VRChat bio. Please make sure you have added it correctly and press the button again.',
        'error.vrchat_not_found': 'Could not find a user on VRChat with the ID `{id}`.',
        'embed.title': 'VRChat Account Verification',
        'embed.description': 'To verify your account, please follow these steps:\n\n1. Copy the following code:\n```{code}```\n2. Paste the code anywhere in your VRChat bio.\n3. Press the "Verify" button below.',
        'embed.footer': 'This button will expire in 5 minutes.',
        'verification.verify': 'Verify',
        'verification.unverify': 'Unverify',
        'verification.cancelaction': 'Cancel',
        'unverify.description': 'You are already verified. Would you like to unlink your VRChat account?',
        'unverify.button': 'Unverify',
        'unverify.success': 'Your account has been successfully unverified.',
        'unverify.error': 'An error occurred while trying to unverify your account.',
        'verify.description': '# Verification\n\nTo verify your account, you need to provide the URL to your VRChat profile as a command argument.',
        'verify.gotovrchat': 'Go to VRChat',
        'success': 'Congratulations! Your account has been successfully verified.',
        'cancelled': 'Verification cancelled.',
    },
    [Locale.SpanishLATAM]: {
        'error.already_verified': 'Ya te encuentras verificado.',
        'error.banned': 'Estás baneado y no puedes verificarte.',
        'error.banned_unverify': 'Estás baneado y no puedes desverificar tu cuenta.',
        'error.vrchat_not_found': 'No se pudo encontrar un usuario en VRChat con el nombre `{username}`. Por favor, revisa que esté bien escrito.',
        'error.generic': 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.',
        'error.timeout': 'La verificación ha expirado. Por favor, ejecuta el comando de nuevo.',
        'error.code_not_found': 'No se encontró el código de verificación en tu biografía de VRChat. Asegúrate de haberlo añadido correctamente y presiona el botón de nuevo.',
        'error.vrchat_not_found': 'No se pudo encontrar un usuario en VRChat con el ID `{id}`. Por favor, revisa que esté bien escrito.',
        'embed.title': 'Verificación de Cuenta de VRChat',
        'embed.description': 'Para verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el siguiente código:\n```{code}```\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Presiona el botón "Verificar" que aparece a continuación.',
        'embed.footer': 'Este botón expirará en 5 minutos.',
        'verification.verify': 'Verificar',
        'verification.unverify': 'Desverificar',
        'verification.cancelaction': 'Cancelar',
        'unverify.description': 'Ya te encuentras verificado. ¿Deseas desvincular tu cuenta de VRChat?',
        'unverify.button': 'Desverificar',
        'unverify.success': 'Tu cuenta ha sido desverificada exitosamente.',
        'unverify.error': 'Ocurrió un error al intentar desverificar tu cuenta.',
        'verify.description': '# Verificación\n\nPara verificar tu cuenta tienes que proporcionar la URL a tu perfil de VRChat como argumento del comando.',
        'verify.gotovrchat': 'Ir a VRChat',
        'success': '¡Felicidades! Tu cuenta ha sido verificada exitosamente.',
        'cancelled': 'Verificación cancelada.',
    },
    [Locale.SpanishES]: {
        'error.already_verified': '¡Pero si ya estás más que verificado, máquina!',
        'error.banned': 'Estás baneado, chaval. Así que de verificarte, nanai de la China.',
        'error.banned_unverify': 'Estás baneado, colega. No puedes quitar la verificación ni de coña.',
        'error.vrchat_not_found': '¡Joder! Que no encuentro a ningún pavo que se llame `{username}` en VRChat. Mírate bien el nombre, anda.',
        'error.generic': 'Madre mía Willy, algo ha petado. Dale un rato y prueba otra vez.',
        'error.timeout': '¡Se te ha pasado el arroz! La verificación ha caducado. Tira el comando de nuevo.',
        'error.code_not_found': '¿Pero dónde está el código? Que no lo veo en tu biografía, me cago en la leche. Asegúrate de que lo has pegado bien y dale al botón otra vez.',
        'error.vrchat_not_found_id': 'Que no, que con el ID `{id}` no hay ni dios en VRChat. Revisa que lo has puesto bien.',
        'embed.title': 'Verificación de la Cuenta de VRChat, ¡al turrón!',
        'embed.description': 'Venga, para verificarte, haz esto que es pan comido:\n\n1. Pilla el código este:\n```{code}```\n2. Lo plantas en cualquier sitio de tu biografía de VRChat.\n3. Le das al botón de \"Verificar\" de aquí abajo y a correr.',
        'embed.footer': 'Ojo, que el botón este se autodestruye en 5 minutos.',
        'verification.verify': '¡Verificar!',
        'verification.unverify': 'Quitar Verificación',
        'verification.cancelaction': 'Cancelar, que me he liado',
        'unverify.description': 'A ver, que ya estás verificado. ¿Seguro que quieres quitar el vínculo con tu cuenta de VRChat?',
        'unverify.button': 'Sí, quitarla',
        'unverify.success': '¡Listo! Tu cuenta ya no está verificada. A otra cosa, mariposa.',
        'unverify.error': '¡Hostia! Algo ha fallado al intentar quitar la verificación.',
        'verify.description': '# Verificación\n\nPara verificarte, tienes que soltar la URL de tu perfil de VRChat en el comando, ¿vale?',
        'verify.gotovrchat': 'Ir a VRChat',
        'success': '¡Enhorabuena, crack! Tu cuenta está verificada. ¡A tope!',
        'cancelled': 'Pues nada, verificación cancelada. Tú te lo pierdes.'
    }
});

// =================================================================================================
// Button Execution
// =================================================================================================

const buttonVerify = verificationCommand.addButton('verify', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;
    const cachedData = VRCHAT_CODE_VERIFY_DATA.get(discordId);
    const userRequestData = {
        discord_id: discordId,
        discord_name: interaction.user.username
    };

    if (!cachedData) {
        return interaction.editReply({
            content: locale['error.timeout'],
            embeds: [],
            components: [],
        });
    }

    const { vrchat_id: vrchatId } = cachedData;
    const vrchatResponse = await VRCHAT_CLIENT.getUser({
        path: {
            userId: vrchatId
        }
    });
    const vrchatData = vrchatResponse.data;
    const code = generateCodeByVRChat(vrchatId);

    if (vrchatData.bio && vrchatData.bio.includes(code)) {
        await D1Class.createProfile(userRequestData, {
            discord_id: discordId,
            vrchat_id: vrchatId,
            vrchat_name: vrchatData.displayName
        });

        const verifyButton = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel(locale['verification.verify'])
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
            .setDisabled(true);

        interaction.member.setNickname(vrchatData.displayName)
            
        await interaction.editReply({
            content: locale['success'],
            embeds: [],
            components: [new ActionRowBuilder().addComponents(verifyButton)]
        });
    } else {
        // Si no, informar al usuario
        await interaction.followUp({
            content: locale['error.code_not_found'],
            flags: MessageFlags.Ephemeral
        });
    }
});

buttonVerify.getButton().setStyle(ButtonStyle.Success).setEmoji('✅');

const buttonUnverify = verificationCommand.addButton('unverify', async ({ interaction, locale }) => {
    await interaction.deferUpdate();
    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };

    let profileData = null;

    try {
        profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
    } catch (error) {
        return interaction.editReply({
            content: locale['error.no_profile'],
            embeds: [],
            components: [],
        });
    }

    if (profileData.is_banned) {
        return interaction.editReply({
            content: locale['error.banned_unverify'],
            embeds: [],
            components: [],
        });
    }

    try {
        const success = await D1Class.deleteProfile(userRequestData, interaction.user.id);
        if (!success) {
            throw new Error('Failed to unverify user in the database.')
        }

        const unverifyBtn = new ButtonBuilder()
            .setCustomId('unverify')
            .setLabel(locale['unverify.button'])
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
            .setDisabled(true);

        await interaction.editReply({
            content: locale['unverify.success'],
            embeds: [],
            components: [new ActionRowBuilder().addComponents(unverifyBtn)],
        });

    } catch (error) {
        console.error('Unverification error:', error);
        await interaction.editReply({
            content: locale['unverify.error'],
            embeds: [],
            components: [],
        });
    }
});

buttonUnverify.getButton().setStyle(ButtonStyle.Danger).setEmoji('🗑️');

const buttonCancel = verificationCommand.addButton('cancelaction', async ({ interaction, locale }) => {
    await interaction.deferUpdate();
    await interaction.editReply({
        content: locale['cancelled'],
        embeds: [],
        components: [],
    });
});

buttonCancel.getButton().setStyle(ButtonStyle.Secondary).setEmoji('⏹️');

const buttonVerifyProfile = verificationCommand.addButton('profile', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

        const videoComponent = new ContainerBuilder()
            .setAccentColor(Colors.Aqua)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(locale['verify.description'])
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({
                    media: {
                        url: 'attachment://' + commandVerifyVideo.name,
                    }
                })
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(goToVRChatButton.setLabel(locale['verify.gotovrchat']))
            );

        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [videoComponent],
            files: [commandVerifyVideo],
        });
});

buttonVerifyProfile.getButton().setStyle(ButtonStyle.Primary).setEmoji('🔗');


// =================================================================================================
// Command Execution
// =================================================================================================

const goToVRChatButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(VRCHAT_URL)
    .setEmoji('🔗');

verificationCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const userRequestData = {
        discord_id: interaction.user.id,
        discord_name: interaction.user.username
    };
    let profileData = null;

    try {
        profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
    } catch (error) {
        // it's normal if the profile doesn't exist
    }

    if (profileData) {
        const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(locale['embed.title'])
            .setDescription(locale['unverify.description']);

        const row = new ActionRowBuilder()
            .addComponents(buttonUnverify.build(locale))
            .addComponents(buttonCancel.build(locale));

        return interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }

    const vrchatId = args['vrchat'] ? getVRChatId(args['vrchat']) : null;
    if (!vrchatId) {
        const videoComponent = new ContainerBuilder()
            .setAccentColor(Colors.Aqua)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(locale['verify.description'])
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems({
                    media: {
                        url: 'attachment://' + commandVerifyVideo.name,
                    }
                })
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(goToVRChatButton.setLabel(locale['verify.gotovrchat']))
            );

        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [videoComponent],
            files: [commandVerifyVideo],
        });

        return;
    }

    // 3. Generar el código y preparar el mensaje
    const verificationCode = generateCodeByVRChat(vrchatId);
    if (!verificationCode) {
        return interaction.editReply(locale['error.vrchat_not_found'].replace('{id}', vrchatId));
    }

    VRCHAT_CODE_VERIFY_DATA.set(interaction.user.id, { vrchat_id: vrchatId });

    // 4. Enviar el mensaje con el código y las instrucciones
    const embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle(locale['embed.title'])
        .setDescription(locale['embed.description'].replace('{code}', verificationCode))
        .setFooter({ text: locale['embed.footer'] });

    const row = new ActionRowBuilder()
        .addComponents(buttonVerify.build(locale))
        .addComponents(buttonCancel.build(locale));

    await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
});

// =================================================================================================
// How to verify
// =================================================================================================

const howToVerifyCommand = new ModularCommand('howtoverify')
    .setDescription('Instructions on how to verify your VRChat account with Discord.');

howToVerifyCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Instructions on how to verify your VRChat account with Discord.',
    [Locale.SpanishLATAM]: 'Instrucciones sobre cómo verificar tu cuenta de VRChat con Discord.',
    [Locale.SpanishES]: 'Instrucciones para verificar tu cuenta de VRChat con Discord, ¡fácil y rápido!',
});

howToVerifyCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'verify.description': '# Verification\n\nTo verify your account, please follow these steps:\n\n1. Copy the verification code generated by the `/verification` command.\n2. Paste the code anywhere in your VRChat bio.\n3. Return to Discord and press the "Verify" button in the verification message.',
        'verify.gotovrchat': 'Go to VRChat',
    },
    [Locale.SpanishLATAM]: {
        'verify.description': '# Verificación\n\nPara verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el código de verificación generado por el comando `/verification`.\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Regresa a Discord y presiona el botón "Verificar" en el mensaje de verificación.',
        'verify.gotovrchat': 'Ir a VRChat',
    },
    [Locale.SpanishES]: {
        'verify.description': '# Verificación\n\nPara verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el código de verificación generado por el comando `/verification`.\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Regresa a Discord y presiona el botón "Verificar" en el mensaje de verificación.',
        'verify.gotovrchat': 'Ir a VRChat',
    }
});

howToVerifyCommand.setExecute(async ({ interaction, locale }) => {
    await interaction.deferReply();

    const videoComponent = new ContainerBuilder()
        .setAccentColor(Colors.Aqua)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(locale['verify.description'])
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems({
                media: {
                    url: 'attachment://' + commandVerifyVideo.name,
                }
            })
        )
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(goToVRChatButton.setLabel(locale['verify.gotovrchat']))
        );

    await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [videoComponent],
        files: [commandVerifyVideo],
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([verificationCommand, howToVerifyCommand]);