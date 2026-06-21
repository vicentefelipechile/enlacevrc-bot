// =========================================================================================================
// Interaction Create Event
// =========================================================================================================
// The single interaction router. It dispatches each interaction kind to the owning command:
//   - chat input  -> command.execute, looked up by commandName
//   - autocomplete -> command.autocomplete, looked up by commandName
//   - button       -> command.handleButton, looked up by the customId prefix (the segment before the
//                     first "_"), which by convention equals the owning command's name.
// This is plain discord.js dispatch, not a framework: the logic, permissions and replies live in the
// commands themselves.

// =========================================================================================================
// Imports
// =========================================================================================================

import type { Interaction } from "discord.js";

import { printMessage } from "../lib/logger.js";
import type { BotClient } from "../types/client.js";
import type { Command } from "../commands/types.js";

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Replies (or follows up) with a generic error message, choosing the right method by reply state. */
async function reportError(
  interaction: Extract<Interaction, { reply: unknown }>,
  error: unknown,
): Promise<void> {
  console.error(error);

  const payload = { content: "An unexpected error occurred.", ephemeral: true } as const;
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (replyError) {
    console.error("Failed to report interaction error:", replyError);
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Routes an incoming interaction to the command that owns it. */
export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  const client = interaction.client as BotClient;

  // Chat-input command invocation.
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      printMessage(`No command matched name "${interaction.commandName}"`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      await reportError(interaction, error);
    }
    return;
  }

  // Autocomplete request.
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Autocomplete failed for "${interaction.commandName}":`, error);
    }
    return;
  }

  // Button press: the owning command is encoded as the customId prefix before the first "_".
  if (interaction.isButton()) {
    const ownerName = interaction.customId.split("_")[0];
    if (!ownerName) {
      return;
    }

    const command: Command | undefined = client.commands.get(ownerName);
    if (!command?.handleButton) {
      return;
    }

    try {
      await command.handleButton(interaction);
    } catch (error) {
      await reportError(interaction, error);
    }
  }
}
