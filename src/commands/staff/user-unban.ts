// =========================================================================================================
// /staff user unban
// =========================================================================================================
// Unbans a user from the EnlaceVRC database (not from Discord).

// =========================================================================================================
// Imports
// =========================================================================================================

import { AttachmentBuilder, Colors, ContainerBuilder, Locale, MessageFlags } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { createLocalizer } from "../../lib/i18n.js";
import { printMessage } from "../../lib/logger.js";
import { D1Class } from "../../services/d1.js";
import { buildContainer } from "../../ui/container.js";
import { staffRequestData } from "./permissions.js";

// =========================================================================================================
// Constants
// =========================================================================================================

export const NAME = "unban";

const ERROR_IMAGE_FILE = "img/error.jpg";
const ERROR_IMAGE_NAME = "error.jpg";
const ERROR_IMAGE_URL = `attachment://${ERROR_IMAGE_NAME}`;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.user_not_found_title": "❌ User Not Found",
    "error.user_not_found": "User profile not found in the database.",
    "error.not_banned_title": "❌ Not Banned",
    "error.not_banned": "This user is not banned from the database.",
    "error.unban_failed_title": "❌ Unban Failed",
    "error.unban_failed": "Failed to unban the user from the database.",
    "success.title": "✅ User Unbanned",
    "success.description": "Successfully unbanned **{username}** from the database.",
    "success.footer": "Unbanned by {moderator}",
  },
  [Locale.SpanishLATAM]: {
    "error.user_not_found_title": "❌ Usuario No Encontrado",
    "error.user_not_found": "Perfil de usuario no encontrado en la base de datos.",
    "error.not_banned_title": "❌ No Está Baneado",
    "error.not_banned": "Este usuario no está baneado de la base de datos.",
    "error.unban_failed_title": "❌ Fallo al Desbanear",
    "error.unban_failed": "No se pudo desbanear al usuario de la base de datos.",
    "success.title": "✅ Usuario Desbaneado",
    "success.description": "Se desbaneó exitosamente a **{username}** de la base de datos.",
    "success.footer": "Desbaneado por {moderator}",
  },
  [Locale.SpanishES]: {
    "error.user_not_found_title": "❌ ¡Que Desaparece el Usuario, Joder!",
    "error.user_not_found":
      "¡Ay, madre mía! ¡Ostras! No encontramos el perfil del tío en la base de datos, macho.",
    "error.not_banned_title": "❌ ¡Que No Está Baneao, Tío!",
    "error.not_banned":
      "¡Vamos chaval! ¡Que no está baneao de la base de datos el fulano! ¡Qué cosa tan rara!",
    "error.unban_failed_title": "❌ ¡Se Ha Liado la Cosa con el Desbaneo, Vaya!",
    "error.unban_failed":
      "¡Ay, que no se pudo desbanear al tío, joder! ¡Qué cosa tan rara! ¡Madre mía!",
    "success.title": "✅ ¡Tío Desbaneao, Olé!",
    "success.description":
      "¡Vaya! ¡Ostras, chaval! Se desbaneó exitosamente a **{username}** de la base de datos, ¡qué bien, eh!",
    "success.footer": "¡Desbaneao por {moderator}, joder, que bien! ¡Olé!",
  },
});

// =========================================================================================================
// Helpers
// =========================================================================================================

function buildErrorContainer(title: string, description: string, color: number): ContainerBuilder {
  return buildContainer({ title, description, color, thumbnail: ERROR_IMAGE_URL });
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `unban` subcommand to the `user` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group.addSubcommand((sub) =>
    sub
      .setName(NAME)
      .setDescription("Unban a user from the database.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Desbanear un usuario de la base de datos.",
        [Locale.SpanishES]: "Desbanear a un tío de la base de datos, joder.",
      })
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to unban from the database.").setRequired(true),
      ),
  );
}

/** Runs `/staff user unban`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);

  const errorImage = new AttachmentBuilder(ERROR_IMAGE_FILE, { name: ERROR_IMAGE_NAME });
  const targetUser = interaction.options.getUser("user", true);

  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, targetUser.id, false);
  } catch {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        buildErrorContainer(
          phrases["error.user_not_found_title"],
          phrases["error.user_not_found"],
          Colors.Red,
        ),
      ],
      files: [errorImage],
    });
    return;
  }

  if (!profileData.is_banned) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        buildErrorContainer(
          phrases["error.not_banned_title"],
          phrases["error.not_banned"],
          Colors.Orange,
        ),
      ],
      files: [errorImage],
    });
    return;
  }

  try {
    await D1Class.unbanProfile(userRequestData, targetUser.id);

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        buildContainer({
          color: Colors.Green,
          title: phrases["success.title"],
          description: phrases["success.description"].replace("{username}", targetUser.displayName),
          thumbnail: targetUser.displayAvatarURL(),
          footer: phrases["success.footer"].replace("{moderator}", interaction.user.displayName),
        }),
      ],
    });
  } catch (error) {
    printMessage("staff user unban error:", String(error));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        buildErrorContainer(
          phrases["error.unban_failed_title"],
          phrases["error.unban_failed"],
          Colors.Red,
        ),
      ],
      files: [errorImage],
    });
  }
}
