/**
 * @file        cmd-verificacion.js
 * @author      vicentefelipechile
 * @license     MIT
 * @description Command to allow a user to verify their Discord account with their VRChat profile.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Locale, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, MessageFlags, Colors } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { IsUserVerified, IsUserBanned, GenerateCodeByVRChat, VerifyUser, GetUserData } = require("../profile");
const { GetUserById } = require("../vrchat"); // Importamos el cliente de VRChat

// =================================================================================================
// Variables
// =================================================================================================

const verificationCommand = new ModularCommand('verification')
    .setDescription('Verify your account by linking it to your VRChat profile.')
    .setCooldown(10)

// =================================================================================================
// Localization
// =================================================================================================

verificationCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Verify your account by linking it to your VRChat profile.',
    [Locale.SpanishLATAM]: 'Verifica tu cuenta vinculándola con tu perfil de VRChat.',
});

verificationCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'error.already_verified': 'You are already verified.',
        'error.banned': 'You are banned and cannot be verified.',
        'error.generic': 'An unexpected error occurred. Please try again later.',
        'error.timeout': 'Verification timed out. Please run the command again.',
        'error.code_not_found': 'The verification code was not found in your VRChat bio. Please make sure you have added it correctly and press the button again.',

        'embed.title': 'VRChat Account Verification',
        'embed.description': 'To verify your account, please follow these steps:\n\n1. Copy the following code:\n```{code}```\n2. Paste the code anywhere in your VRChat bio.\n3. Press the "Verify" button below.',
        'embed.footer': 'This button will expire in 5 minutes.',

        'verification.verify': 'Verify',
        'success': 'Congratulations! Your account has been successfully verified.',
    },
    [Locale.SpanishLATAM]: {
        'error.already_verified': 'Ya te encuentras verificado.',
        'error.banned': 'Estás baneado y no puedes verificarte.',
        'error.vrchat_not_found': 'No se pudo encontrar un usuario en VRChat con el nombre `{username}`. Por favor, revisa que esté bien escrito.',
        'error.generic': 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.',
        'error.timeout': 'La verificación ha expirado. Por favor, ejecuta el comando de nuevo.',
        'error.code_not_found': 'No se encontró el código de verificación en tu biografía de VRChat. Asegúrate de haberlo añadido correctamente y presiona el botón de nuevo.',

        'embed.title': 'Verificación de Cuenta de VRChat',
        'embed.description': 'Para verificar tu cuenta, por favor sigue estos pasos:\n\n1. Copia el siguiente código:\n```{code}```\n2. Pega el código en cualquier parte de tu biografía de VRChat.\n3. Presiona el botón "Verificar" que aparece a continuación.',
        'embed.footer': 'Este botón expirará en 5 minutos.',

        'verification.verify': 'Verificar',
        'success': '¡Felicidades! Tu cuenta ha sido verificada exitosamente.',
    }
});

// =================================================================================================
// Button Execution
// =================================================================================================

const buttonVerify = verificationCommand.addButton('verify', async ({ interaction, locale }) => {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;
    let userData;
    try {
        const response = await GetUserData(discordId);
        userData = response.data;
    } catch (error) {
        console.error("VRChat API search error:", error);
        return interaction.editReply({
            content: locale['error.generic'],
            embeds: [],
            components: [],
        });
    }

    const verificationCode = GenerateCodeByVRChat(userData.vrchat_id);

    try {
        // Re-obtener el perfil actualizado del usuario de VRChat
        const profileData = await GetUserById(userData.vrchat_id);

        if (profileData.bio && profileData.bio.includes(verificationCode)) {
            await VerifyUser(discordId, userData.vrchat_id, userData.vrchat_name);

            verifyButton.setDisabled(true);
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

// =================================================================================================
// Command Execution
// =================================================================================================

verificationCommand.setExecute(async ({ interaction, locale }) => {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const discordId = interaction.user.id;

    if (await IsUserVerified(discordId)) {
        return interaction.editReply(locale['error.already_verified']);
    }
    if (await IsUserBanned(discordId)) {
        return interaction.editReply(locale['error.banned']);
    }

    // 2. Buscar al usuario en la API de VRChat
    let profileData;
    try {
        const response = await GetUserData(discordId);
        profileData = response.data;
    } catch (error) {
        console.error("VRChat API search error:", error);
        return interaction.editReply(locale['error.generic']);
    }

    // 3. Generar el código y preparar el mensaje
    const verificationCode = GenerateCodeByVRChat(profileData.vrchat_id);

    const embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle(locale['embed.title'])
        .setDescription(locale['embed.description'].replace('{code}', verificationCode))
        .setFooter({ text: locale['embed.footer'] });

    const row = new ActionRowBuilder().addComponents(buttonVerify.build(locale));

    await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([verificationCommand]);