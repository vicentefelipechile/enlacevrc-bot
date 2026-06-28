// =========================================================================================================
// /staff member remove
// =========================================================================================================
// Removes an authorized staff member from the database.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Colors, Locale, MessageFlags } from "discord.js";
import type {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { createLocalizer } from "../../lib/i18n.js";
import { printMessage } from "../../lib/logger.js";
import { D1Class } from "../../services/d1.js";
import { buildContainer, textContainer } from "../../ui/container.js";
import { staffRequestData } from "./permissions.js";

// =========================================================================================================
// Constants
// =========================================================================================================

export const NAME = "remove";

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.not_staff": "**{username}** is not a registered staff member.",
    "error.general": "Failed to remove the staff member. Please try again later.",
    "success.title": "✅ Staff Removed",
    "success.description": "**{username}** is no longer a staff member.",
  },
  [Locale.SpanishLATAM]: {
    "error.not_staff": "**{username}** no es un miembro del staff registrado.",
    "error.general": "No se pudo eliminar al miembro del staff. Inténtalo de nuevo más tarde.",
    "success.title": "✅ Staff Eliminado",
    "success.description": "**{username}** ya no es un miembro del staff.",
  },
  [Locale.SpanishES]: {
    "error.not_staff": "¡Pero qué dices! **{username}** no está apuntao como staff, chaval.",
    "error.general": "¡Joder! No se pudo quitar al staff. Dale un rato y prueba otra vez, tío.",
    "success.title": "✅ ¡Staff Fuera, Olé!",
    "success.description": "**{username}** ya no es del staff, se acabó lo que se daba.",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `remove` subcommand to the `member` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group.addSubcommand((sub) =>
    sub
      .setName(NAME)
      .setDescription("Remove a staff member.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Eliminar un miembro del staff.",
        [Locale.SpanishES]: "Quitar a un miembro del staff, joder.",
      })
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The staff member to remove.").setRequired(true),
      ),
  );
}

/** Runs `/staff member remove`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const targetUser = interaction.options.getUser("user", true);

  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

  // Confirm the target is registered before removing.
  let existingStaff = null;
  try {
    existingStaff = await D1Class.getStaff(userRequestData, targetUser.id, false);
  } catch {
    existingStaff = null;
  }

  if (!existingStaff) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        textContainer(
          phrases["error.not_staff"].replace("{username}", targetUser.displayName),
          Colors.Red,
        ),
      ],
    });
    return;
  }

  try {
    await D1Class.deleteStaff(userRequestData, targetUser.id);

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        buildContainer({
          color: Colors.Green,
          title: phrases["success.title"],
          description: phrases["success.description"].replace("{username}", targetUser.displayName),
          thumbnail: targetUser.displayAvatarURL(),
        }),
      ],
    });
  } catch (error) {
    printMessage("staff member remove error:", String(error));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.general"], Colors.Red)],
    });
  }
}
