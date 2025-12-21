/**
 * @file        commands/invite.js
 * @author      vicentefelipechile
 * @description Command to get the invite link for the bot.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { PermissionFlagsBits, Locale, Colors, ActionRowBuilder, ButtonStyle, ButtonBuilder, MessageFlags, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, AttachmentBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
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

const inviteButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(inviteUrl)
    .setEmoji('📎');

const avatarAttachment = new AttachmentBuilder('img/avatar.jpg', { name: 'avatar.jpg' });

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
    const contentText = '# ' + locale['embed.title'] + '\n\n' + locale['embed.description'];

    const container = new ContainerBuilder()
        .setAccentColor(Colors.Aqua)
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(contentText)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL('attachment://' + avatarAttachment.name)
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(inviteButton.setLabel(locale['button.invite']))
        );

    await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        files: [avatarAttachment]
    });
});

// =================================================================================================
// Exports
// =================================================================================================

module.exports = RegisterCommand([inviteCommand]);