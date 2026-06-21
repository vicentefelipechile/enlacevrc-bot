// =========================================================================================================
// /staff member add
// =========================================================================================================
// Registers a new authorized staff member in the database. Authorized staff can run every /staff
// subcommand (profile management and staff management).

// =========================================================================================================
// Imports
// =========================================================================================================

import { Colors, EmbedBuilder, Locale } from "discord.js";
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

export const NAME = "add";

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.already_staff": "**{username}** is already a registered staff member.",
    "error.general": "Failed to add the staff member. Please try again later.",
    "success.title": "✅ Staff Added",
    "success.description": "**{username}** has been registered as staff.",
  },
  [Locale.SpanishLATAM]: {
    "error.already_staff": "**{username}** ya es un miembro del staff registrado.",
    "error.general": "No se pudo agregar al miembro del staff. Inténtalo de nuevo más tarde.",
    "success.title": "✅ Staff Agregado",
    "success.description": "**{username}** ha sido registrado como staff.",
  },
  [Locale.SpanishES]: {
    "error.already_staff": "¡Anda ya! **{username}** ya está apuntao como staff, chaval.",
    "error.general": "¡Joder! No se pudo agregar al staff. Dale un rato y prueba otra vez, tío.",
    "success.title": "✅ ¡Staff Agregao, Olé!",
    "success.description": "**{username}** ya está apuntao como staff, crack.",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `add` subcommand to the `member` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group.addSubcommand((sub) =>
    sub
      .setName(NAME)
      .setDescription("Register a new staff member.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Registrar un nuevo miembro del staff.",
        [Locale.SpanishES]: "Apuntar a un nuevo miembro del staff, tronco.",
      })
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The Discord user to register as staff.").setRequired(true),
      ),
  );
}

/** Runs `/staff member add`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const targetUser = interaction.options.getUser("user", true);

  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

  // Bail out if the target is already registered.
  try {
    const existing = await D1Class.getStaff(userRequestData, targetUser.id, false);
    if (existing) {
      await interaction.editReply({
        content: phrases["error.already_staff"].replace("{username}", targetUser.displayName),
      });
      return;
    }
  } catch {
    // Not found: expected for a new staff member, continue.
  }

  try {
    await D1Class.createStaff(userRequestData, {
      discord_id: targetUser.id,
      discord_name: targetUser.username,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(phrases["success.title"])
      .setDescription(phrases["success.description"].replace("{username}", targetUser.displayName))
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    printMessage("staff member add error:", String(error));
    await interaction.editReply({ content: phrases["error.general"] });
  }
}
