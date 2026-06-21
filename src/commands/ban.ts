// =========================================================================================================
// Ban Command
// =========================================================================================================
// Staff-only command to ban a user from the EnlaceVRC database (not from Discord). A banned user cannot
// unlink their VRChat account or verify on other servers. Targets are given either by Discord user or by
// raw ID via two subcommands.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  AttachmentBuilder,
  Colors,
  EmbedBuilder,
  Locale,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND = { USER: "user", ID: "id" } as const;
const ARGS = { USER: "user", ID: "id", REASON: "reason" } as const;

const ERROR_IMAGE_FILE = "img/error.jpg";
const ERROR_IMAGE_NAME = "error.jpg";
const ERROR_IMAGE_URL = `attachment://${ERROR_IMAGE_NAME}`;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_permission": "You do not have permission to use this command.",
    "error.user_not_found_title": "❌ User Not Found",
    "error.user_not_found": "User profile not found in the database.",
    "error.already_banned_title": "❌ Already Banned",
    "error.already_banned": "This user is already banned from the database.",
    "error.ban_failed_title": "❌ Ban Failed",
    "error.ban_failed": "Failed to ban the user from the database.",
    "success.title": "✅ User Banned",
    "success.description":
      "Successfully banned **{username}** from the database, now the user will not be able to unlink their VRChat account with Discord, nor will they be able to verify in other servers globally.",
    "success.reason": "**Reason:** {reason}",
    "success.footer": "Banned by {moderator}",
  },
  [Locale.SpanishLATAM]: {
    "error.no_permission": "No tienes permisos para utilizar este comando.",
    "error.user_not_found_title": "❌ Usuario No Encontrado",
    "error.user_not_found": "Perfil de usuario no encontrado en la base de datos.",
    "error.already_banned_title": "❌ Ya Baneado",
    "error.already_banned": "Este usuario ya está baneado de la base de datos.",
    "error.ban_failed_title": "❌ Fallo al Banear",
    "error.ban_failed": "No se pudo banear al usuario de la base de datos.",
    "success.title": "✅ Usuario Baneado",
    "success.description":
      "Se baneó exitosamente a **{username}** de la base de datos, ahora el usuario no podrá desvincular su cuenta de VRChat con la de Discord, tampoco podrá verificarse en otros servidores de manera global.",
    "success.reason": "**Razón:** {reason}",
    "success.footer": "Baneado por {moderator}",
  },
  [Locale.SpanishES]: {
    "error.no_permission": "¡Joder tío, no tienes permisos pa usar este comando, chaval!",
    "error.user_not_found_title": "❌ ¡Que Desaparece el Usuario, Joder!",
    "error.user_not_found":
      "¡Ay, madre mía! ¡Ostras! No encontramos el perfil del tío en la base de datos, macho.",
    "error.already_banned_title": "❌ ¡Que Ya Está Baneao, Macho!",
    "error.already_banned":
      "¡Vamos tío! ¡Que ya está baneao de la base de datos el fulano! ¡Qué nervio!",
    "error.ban_failed_title": "❌ ¡Se Ha Liado la Cosa con el Baneo, Vaya!",
    "error.ban_failed": "¡Ay, que no se pudo banear al tío, joder! ¡Qué cosa tan rara! ¡Madre mía!",
    "success.title": "✅ ¡Tío Baneao, Olé!",
    "success.description":
      "¡Vaya! ¡Ostras, chaval! Se baneó exitosamente a **{username}** de la base de datos, ahora el usuario no podrá desvincular su cuenta de VRChat con la de Discord, tampoco podrá verificarse en otros servidores de manera global.",
    "success.reason": "**Razón:** {reason}",
    "success.footer": "¡Baneao por {moderator}, joder, que bien! ¡Olé!",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

/** Resolved ban target: the database key plus display fields for the response embed. */
interface BanTarget {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** True when the invoking user is registered staff. */
async function isStaff(userId: string, username: string): Promise<boolean> {
  try {
    const staff = await D1Class.getStaff({ discord_id: userId, discord_name: username }, userId);
    return staff !== null;
  } catch {
    return false;
  }
}

function buildErrorEmbed(title: string, description: string, color: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setThumbnail(ERROR_IMAGE_URL)
    .setTimestamp();
}

/** Resolves the ban target from whichever subcommand was used. */
function resolveTarget(interaction: ChatInputCommandInteraction): BanTarget {
  if (interaction.options.getSubcommand() === SUBCOMMAND.USER) {
    const user = interaction.options.getUser(ARGS.USER, true);
    return { id: user.id, displayName: user.displayName, avatarUrl: user.displayAvatarURL() };
  }

  const id = interaction.options.getString(ARGS.ID, true);
  return { id, displayName: id, avatarUrl: null };
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a user from the database (Staff only).")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Banear un usuario de la base de datos (Solo staff).",
    [Locale.SpanishES]: "¡Banear un tío de la base de datos (Solo staff, joder)!",
  })
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.USER)
      .setDescription("Ban a user from the database.")
      .addUserOption((opt) =>
        opt.setName(ARGS.USER).setDescription("The user to ban from the database.").setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName(ARGS.REASON).setDescription("The reason for the ban.").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.ID)
      .setDescription("Ban a user from the database by ID.")
      .addStringOption((opt) =>
        opt.setName(ARGS.ID).setDescription("The user ID to ban from the database.").setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName(ARGS.REASON).setDescription("The reason for the ban.").setRequired(true),
      ),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases: Phrases = localize(interaction.locale);

  if (!(await isStaff(interaction.user.id, interaction.user.username))) {
    await interaction.editReply({ content: phrases["error.no_permission"] });
    return;
  }

  const errorImage = new AttachmentBuilder(ERROR_IMAGE_FILE, { name: ERROR_IMAGE_NAME });
  const target = resolveTarget(interaction);
  const banReason = interaction.options.getString(ARGS.REASON, true);

  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, target.id, false);
  } catch {
    await interaction.editReply({
      embeds: [
        buildErrorEmbed(
          phrases["error.user_not_found_title"],
          phrases["error.user_not_found"],
          Colors.Red,
        ),
      ],
      files: [errorImage],
    });
    return;
  }

  if (profileData.is_banned) {
    await interaction.editReply({
      embeds: [
        buildErrorEmbed(
          phrases["error.already_banned_title"],
          phrases["error.already_banned"],
          Colors.Orange,
        ),
      ],
      files: [errorImage],
    });
    return;
  }

  try {
    await D1Class.banProfile(userRequestData, target.id, banReason);

    const embed = new EmbedBuilder()
      .setTitle(phrases["success.title"])
      .setDescription(phrases["success.description"].replace("{username}", target.displayName))
      .addFields({ name: "​", value: phrases["success.reason"].replace("{reason}", banReason) })
      .setColor(Colors.Green)
      .setFooter({
        text: phrases["success.footer"].replace("{moderator}", interaction.user.displayName),
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (target.avatarUrl) {
      embed.setThumbnail(target.avatarUrl);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    printMessage("Ban error:", String(error));
    await interaction.editReply({
      embeds: [
        buildErrorEmbed(phrases["error.ban_failed_title"], phrases["error.ban_failed"], Colors.Red),
      ],
      files: [errorImage],
    });
  }
}

export const command: Command = { data, execute };
