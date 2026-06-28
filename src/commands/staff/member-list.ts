// =========================================================================================================
// /staff member list
// =========================================================================================================
// Lists every authorized staff member registered in the database.

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

export const NAME = "list";

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.general": "Failed to fetch the staff list. Please try again later.",
    empty: "There are no registered staff members.",
    "list.title": "👥 Staff Members ({count})",
    "list.entry": "<@{discord_id}> — added {added_at}",
  },
  [Locale.SpanishLATAM]: {
    "error.general": "No se pudo obtener la lista de staff. Inténtalo de nuevo más tarde.",
    empty: "No hay miembros del staff registrados.",
    "list.title": "👥 Miembros del Staff ({count})",
    "list.entry": "<@{discord_id}> — agregado el {added_at}",
  },
  [Locale.SpanishES]: {
    "error.general": "¡Joder! No se pudo pillar la lista de staff. Dale un rato y prueba otra vez, tío.",
    empty: "¡No hay ni un alma apuntá como staff, chaval!",
    "list.title": "👥 La Basca del Staff ({count})",
    "list.entry": "<@{discord_id}> — apuntao el {added_at}",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

/** Adds the `list` subcommand to the `member` group. */
export function build(group: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
  return group.addSubcommand((sub) =>
    sub
      .setName(NAME)
      .setDescription("List all staff members.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Listar todos los miembros del staff.",
        [Locale.SpanishES]: "Ver toda la basca del staff, chaval.",
      }),
  );
}

/** Runs `/staff member list`. The staff gate has already passed in the router. */
export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  const phrases = localize(interaction.locale);
  const userRequestData = staffRequestData(interaction.user.id, interaction.user.username);

  let staffList;
  try {
    staffList = await D1Class.listStaff(userRequestData, false);
  } catch (error) {
    printMessage("staff member list error:", String(error));
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.general"], Colors.Red)],
    });
    return;
  }

  if (staffList.length === 0) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases.empty)],
    });
    return;
  }

  const description = staffList
    .map((staff) =>
      phrases["list.entry"]
        .replace("{discord_id}", staff.discord_id)
        .replace("{added_at}", staff.added_at),
    )
    .join("\n");

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [
      buildContainer({
        color: Colors.Blurple,
        title: phrases["list.title"].replace("{count}", String(staffList.length)),
        description,
      }),
    ],
  });
}
