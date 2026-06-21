// =========================================================================================================
// /staff user ban  and  /staff user banid
// =========================================================================================================
// Bans a user from the EnlaceVRC database (not from Discord). A banned user cannot unlink their VRChat
// account or verify on other servers. The target is given either by Discord user (`ban`) or by raw
// profile ID (`banid`).

// =========================================================================================================
// Imports
// =========================================================================================================

import { AttachmentBuilder, Colors, EmbedBuilder, Locale } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { createLocalizer } from "../../lib/i18n.js";
import { printMessage } from "../../lib/logger.js";
import { D1Class } from "../../services/d1.js";
import { staffRequestData } from "./permissions.js";

// =========================================================================================================
// Constants
// =========================================================================================================

export const NAME_BY_USER = "ban";
export const NAME_BY_ID = "banid";

const ARGS = { USER: "user", ID: "id", REASON: "reason" } as const;

const ERROR_IMAGE_FILE = "img/error.jpg";
const ERROR_IMAGE_NAME = "error.jpg";
const ERROR_IMAGE_URL = `attachment://${ERROR_IMAGE_NAME}`;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
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
  if (interaction.options.getSubcommand() === NAME_BY_USER) {
    const user = interaction.options.getUser(ARGS.USER, true);
    return { id: user.id, displayName: user.displayName, avatarUrl: user.displayAvatarURL() };
  }

  const id = interaction.options.getString(ARGS.ID, true);
  return { id, displayName: id, avatarUrl: null };
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `ban` and `banid` subcommands to the `user` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group
    .addSubcommand((sub) =>
      sub
        .setName(NAME_BY_USER)
        .setDescription("Ban a user from the database.")
        .setDescriptionLocalizations({
          [Locale.SpanishLATAM]: "Banear un usuario de la base de datos.",
          [Locale.SpanishES]: "Banear a un tío de la base de datos, joder.",
        })
        .addUserOption((opt) =>
          opt.setName(ARGS.USER).setDescription("The user to ban from the database.").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName(ARGS.REASON).setDescription("The reason for the ban.").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(NAME_BY_ID)
        .setDescription("Ban a user from the database by ID.")
        .setDescriptionLocalizations({
          [Locale.SpanishLATAM]: "Banear un usuario de la base de datos por ID.",
          [Locale.SpanishES]: "Banear a un tío de la base de datos por su ID, chaval.",
        })
        .addStringOption((opt) =>
          opt.setName(ARGS.ID).setDescription("The user ID to ban from the database.").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName(ARGS.REASON).setDescription("The reason for the ban.").setRequired(true),
        ),
    );
}

/** Runs `/staff user ban` or `/staff user banid`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases: Phrases = localize(interaction.locale);

  const errorImage = new AttachmentBuilder(ERROR_IMAGE_FILE, { name: ERROR_IMAGE_NAME });
  const target = resolveTarget(interaction);
  const banReason = interaction.options.getString(ARGS.REASON, true);

  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

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
    printMessage("staff user ban error:", String(error));
    await interaction.editReply({
      embeds: [
        buildErrorEmbed(phrases["error.ban_failed_title"], phrases["error.ban_failed"], Colors.Red),
      ],
      files: [errorImage],
    });
  }
}
