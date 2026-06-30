// =========================================================================================================
// Invite Command
// =========================================================================================================
// Replies with a button linking to the bot's OAuth2 invite URL, pre-filled with the permissions the bot
// needs to operate. Localized for the three supported locales via interaction.locale.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ContainerBuilder,
  Locale,
  MessageFlags,
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { env } from "../config/env.js";
import { createLocalizer } from "../lib/i18n.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const REQUIRED_PERMISSIONS =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.ManageRoles |
  PermissionFlagsBits.ManageNicknames |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.AttachFiles |
  PermissionFlagsBits.AddReactions |
  PermissionFlagsBits.UseExternalEmojis |
  PermissionFlagsBits.UseExternalStickers;

const SCOPE_URL = new URLSearchParams({
  client_id: env.DISCORD_CLIENT_ID,
  scope: "bot+applications.commands",
  permissions: REQUIRED_PERMISSIONS.toString(),
});

const INVITE_URL =
  `https://discord.com/oauth2/authorize?${SCOPE_URL.toString()}`;

const AVATAR_FILE = "img/avatar.jpg";
const AVATAR_ATTACHMENT_NAME = "avatar.jpg";

// Localized strings, selected by the viewer's locale at reply time.
const localize = createLocalizer({
  [Locale.EnglishUS]: {
    title: "Invite Bot",
    description: "Click the button below to invite the bot to your server.",
    button: "Invite",
  },
  [Locale.SpanishLATAM]: {
    title: "Invitar Bot",
    description: "Haz clic en el botón de abajo para invitar al bot a tu servidor.",
    button: "Invitar",
  },
  [Locale.SpanishES]: {
    title: "Invitar al Bot",
    description: "Dale clic en el botón de abajo pa meter el bot en tu server.",
    button: "Invitar",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Get the invite link for the bot.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Obtén el enlace de invitación para el bot.",
    [Locale.SpanishES]: "Pilla el enlace pa invitar al bot, tío.",
  });

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);

  const avatar = new AttachmentBuilder(AVATAR_FILE, { name: AVATAR_ATTACHMENT_NAME });
  const avatarUrl = `attachment://${AVATAR_ATTACHMENT_NAME}`;

  const inviteButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(INVITE_URL)
    .setEmoji("📎")
    .setLabel(phrases.button);

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Aqua)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${phrases.title}\n\n${phrases.description}`),
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(inviteButton),
    );

  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: [avatar],
  });
}

export const command: Command = { data, execute };
