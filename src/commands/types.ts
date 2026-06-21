// =========================================================================================================
// Command Shape
// =========================================================================================================
// The plain object each command file exports, following the official discord.js command-handling guide.
// This is not a framework: it is only the shared shape so index.ts can store commands in a Collection
// and dispatch by name with type safety. Cooldown, permissions and localized replies live inside each
// command using native discord.js APIs.

import type {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

// =========================================================================================================
// Types
// =========================================================================================================

/** Builder variants that expose a top-level name and toJSON for deployment. */
export type CommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface Command {
  /** Slash command definition (used for deployment and runtime name lookup). */
  data: CommandData;

  /** Runs the chat-input invocation. */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;

  /** Optional autocomplete handler for commands with autocompletable options. */
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;

  /** Optional button handlers for this command's message components. */
  handleButton?(interaction: ButtonInteraction): Promise<void>;
}
