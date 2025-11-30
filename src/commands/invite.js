/**
 * @file        commands/invite.js
 * @author      vicentefelipechile
 * @description Command to get the invite link for the bot.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { PermissionFlagsBits, EmbedBuilder, Locale, Colors, ActionRowBuilder, ButtonStyle, ButtonBuilder, MessageFlags } = require("discord.js");
const { ModularCommand, RegisterCommand } = require("js-discord-modularcommand");
const { DISCORD_CLIENT_ID } = require("../env");

// =================================================================================================
// Variables
// =================================================================================================

const PermissionCode = PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.ManageRoles |
    PermissionFlagsBits.ManageNicknames |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.AddReactions |
    PermissionFlagsBits.UseExternalEmojis |
    PermissionFlagsBits.UseExternalStickers;

const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot&permissions=${PermissionCode}`;

const inviteCommand = new ModularCommand('invite')
    .setDescription('Get the invite link for the bot.')
    .setCooldown(5);

// =================================================================================================
// Localization
// =================================================================================================

inviteCommand.setLocalizationDescription({
    [Locale.EnglishUS]: 'Get the invite link for the bot.',
    [Locale.SpanishLATAM]: 'Obtén el enlace de invitación para el bot.',
    [Locale.SpanishES]: 'Pilla el enlace pa invitar al bot, tío.',
});

inviteCommand.setLocalizationPhrases({
    [Locale.EnglishUS]: {
        'embed.title': 'Invite Bot',
        'embed.description': 'Click the button below to invite the bot to your server.',
        'button.invite': 'Invite'
    },
    [Locale.SpanishLATAM]: {
        'embed.title': 'Invitar Bot',
        'embed.description': 'Haz clic en el boton de abajo para invitar al bot a tu servidor.',
        'button.invite': 'Invitar'
    },
    [Locale.SpanishES]: {
        'embed.title': 'Invitar al Bot',
        'embed.description': 'Dale clic en el boton de abajo pa meter el bot en tu server.',
        'button.invite': 'Invitar'
    }
});

// =================================================================================================
// Command Execution
// =================================================================================================

inviteCommand.setExecute(async ({ interaction, locale }) => {
    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel(locale['button.invite'])
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl)
                .setEmoji('📎')
        );

    const embed = new EmbedBuilder()
        .setTitle(locale['embed.title'])
        .setDescription(locale['embed.description'])
        .setThumbnail(interaction.user.displayAvatarURL({ size: 1024 }))
        .setColor(Colors.Purple);

    await interaction.reply({
        embeds: [embed],
        components: [button],
        flags: MessageFlags.Ephemeral
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([inviteCommand]);