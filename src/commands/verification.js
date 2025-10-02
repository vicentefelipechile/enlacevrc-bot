/**
 * @file        commands/verification.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to allow a user to verify their Discord account with their VRChat profile.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, Colors, AttachmentBuilder, ApplicationCommandOptionType } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const NodeCache = require("node-cache");
const Profile = require("../models/profile");

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
    }
})

verificationCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Verify your account by linking it to your VRChat profile.',
    [Locale.SpanishLATAM]: 'Verifica tu cuenta vinculándola con tu perfil de VRChat.',
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
        'success': 'Congratulations! Your account has been successfully verified.',
        'cancelled': 'Verification cancelled.',

        'unverify.description': 'You are already verified. Would you like to unlink your VRChat account?',
        'unverify.button': 'Unverify',
        'unverify.success': 'Your account has been successfully unverified.',
        'unverify.error': 'An error occurred while trying to unverify your account.',

        'verify.title': 'Verify with your VRChat profile',
        'verify.description': `To verify your account, you need to provide the URL to your VRChat profile as a command argument.\n\n[Go to VRChat](${VRCHAT_URL})`
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
        'success': '¡Felicidades! Tu cuenta ha sido verificada exitosamente.',
        'cancelled': 'Verificación cancelada.',

        'unverify.description': 'Ya te encuentras verificado. ¿Deseas desvincular tu cuenta de VRChat?',
        'unverify.button': 'Desverificar',
        'unverify.success': 'Tu cuenta ha sido desverificada exitosamente.',
        'unverify.error': 'Ocurrió un error al intentar desverificar tu cuenta.',

        'verify.title': 'Verificar con tu perfil de VRChat',
        'verify.description': `Para verificar tu cuenta tienes que proporcionar la URL a tu perfil de VRChat como argumento del comando.\n\n[Ir a VRChat](${VRCHAT_URL})`
    }
});

// =================================================================================================
// Button Execution
// =================================================================================================

const buttonVerify = verificationCommand.addButton('verify', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;
    const cachedData = VRCHAT_CODE_VERIFY_DATA.get(discordId);

    if (!cachedData) {
        return interaction.editReply({
            content: locale['error.timeout'],
            embeds: [],
            components: [],
        });
    }

    const { vrchat_id: vrchatId } = cachedData;
    const partialProfile = await Profile.create(vrchatId);
    const code = Profile.generateCodeByVRChat(vrchatId);

    try {
        const vrchatData = partialProfile.getVRChatData();

        if (vrchatData.bio && vrchatData.bio.includes(code)) {
            const profile = await Profile.createUserWithAutoName(vrchatId, discordId);
            if (!profile) {
                throw new Error('Failed to verify user in the database.');
            }

            const verifyButton = new ButtonBuilder()
                .setCustomId('verify')
                .setLabel(locale['verification.verify'])
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
                .setDisabled(true);
                
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
    } catch (error) {
        console.error("Verification process error:", error);
        await interaction.followUp({
            content: locale['error.generic'],
            flags: MessageFlags.Ephemeral
        });
    }
});

buttonVerify.getButton().setStyle(ButtonStyle.Success).setEmoji('✅');

const buttonUnverify = verificationCommand.addButton('unverify', async ({ interaction, locale }) => {
    await interaction.deferUpdate();
    const profile = await Profile.create(interaction.user.id);
    const isBanned = await profile.isBanned();

    if (isBanned) {
        return interaction.editReply({
            content: locale['error.banned_unverify'],
            embeds: [],
            components: [],
        });
    }

    try {
        const success = await profile.unverify();
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
        console.error("Unverification error:", error);
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

    const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle(locale['verify.title'])
        .setDescription(locale['verify.description']);

    await interaction.editReply({
        content: '',
        embeds: [embed],
        components: [],
        files: [commandVerifyVideo],
    });
});

buttonVerifyProfile.getButton().setStyle(ButtonStyle.Primary).setEmoji('🔗');


// =================================================================================================
// Command Execution
// =================================================================================================

verificationCommand.setExecute(async ({ interaction, locale, args }) => {
    await interaction.deferReply();

    const profile = await Profile.create(interaction.user.id);
    const isVerified = await profile.isVerified();

    if (isVerified) {
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

    const vrchatId = args['vrchat'] ? Profile.getVRChatId(args['vrchat']) : null;
    if (!vrchatId) {
        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(locale['verify.title'])
            .setDescription(locale['verify.description']);

        await interaction.editReply({
            content: '',
            embeds: [embed],
            components: [],
            files: [commandVerifyVideo],
        });

        return;
    }

    const isBanned = await profile.isBanned();
    if (isBanned) {
        return interaction.editReply(locale['error.banned']);
    }

    // 3. Generar el código y preparar el mensaje
    const verificationCode = Profile.generateCodeByVRChat(vrchatId);
    if (!verificationCode) {
        return interaction.editReply(locale['error.vrchat_not_found'].replace('{id}', vrchatId));
    }

    VRCHAT_CODE_VERIFY_DATA.set(profile.getProfileId(), { vrchat_id: vrchatId });

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
// Exports
// =================================================================================================

module.exports = RegisterCommand([verificationCommand]);