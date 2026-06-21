// =========================================================================================================
// /staff Command
// =========================================================================================================
// Groups every staff-only action under a single command, organized by area:
//   /staff user   add | ban | banid | unban | verify    — profile management
//   /staff member add | remove | list                   — staff roster management
// The command builder is assembled from the per-subcommand modules, and the router gates access (a
// single staff check) before dispatching to the matching `run`.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Locale, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import { createLocalizer } from "../../lib/i18n.js";
import type { Command } from "../types.js";
import * as memberAdd from "./member-add.js";
import * as memberList from "./member-list.js";
import * as memberRemove from "./member-remove.js";
import { isStaff } from "./permissions.js";
import * as userAdd from "./user-add.js";
import * as userBan from "./user-ban.js";
import * as userUnban from "./user-unban.js";
import * as userVerify from "./user-verify.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const GROUP = { USER: "user", MEMBER: "member" } as const;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_permission": "You do not have permission to use this command.",
    "error.unknown": "Unknown subcommand.",
  },
  [Locale.SpanishLATAM]: {
    "error.no_permission": "No tienes permisos para utilizar este comando.",
    "error.unknown": "Subcomando desconocido.",
  },
  [Locale.SpanishES]: {
    "error.no_permission": "¡Joder tío, no tienes permisos pa usar este comando, chaval!",
    "error.unknown": "¡Pero qué subcomando es ese, tronco! Ni idea.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

/** A resolved subcommand handler keyed by its `group/name` route. */
type Handler = (interaction: ChatInputCommandInteraction) => Promise<void>;

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Maps each `group:name` route to its handler. */
const ROUTES: Record<string, Handler> = {
  [`${GROUP.USER}:${userAdd.NAME}`]: userAdd.run,
  [`${GROUP.USER}:${userBan.NAME_BY_USER}`]: userBan.run,
  [`${GROUP.USER}:${userBan.NAME_BY_ID}`]: userBan.run,
  [`${GROUP.USER}:${userUnban.NAME}`]: userUnban.run,
  [`${GROUP.USER}:${userVerify.NAME}`]: userVerify.run,
  [`${GROUP.MEMBER}:${memberAdd.NAME}`]: memberAdd.run,
  [`${GROUP.MEMBER}:${memberRemove.NAME}`]: memberRemove.run,
  [`${GROUP.MEMBER}:${memberList.NAME}`]: memberList.run,
};

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("staff")
  .setDescription("Staff-only management commands.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Comandos de gestión solo para staff.",
    [Locale.SpanishES]: "Comandos de gestión solo pa staff, chaval.",
  })
  .addSubcommandGroup((group) => {
    group
      .setName(GROUP.USER)
      .setDescription("Profile management actions.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Acciones de gestión de perfiles.",
        [Locale.SpanishES]: "Acciones pa gestionar los perfiles, tronco.",
      });
    userAdd.build(group);
    userBan.build(group);
    userUnban.build(group);
    userVerify.build(group);
    return group;
  })
  .addSubcommandGroup((group) => {
    group
      .setName(GROUP.MEMBER)
      .setDescription("Staff roster management actions.")
      .setDescriptionLocalizations({
        [Locale.SpanishLATAM]: "Acciones de gestión del staff.",
        [Locale.SpanishES]: "Acciones pa gestionar la basca del staff, chaval.",
      });
    memberAdd.build(group);
    memberRemove.build(group);
    memberList.build(group);
    return group;
  });

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  if (!(await isStaff(interaction.user.id, interaction.user.username))) {
    await interaction.editReply({ content: phrases["error.no_permission"] });
    return;
  }

  const group = interaction.options.getSubcommandGroup(true);
  const sub = interaction.options.getSubcommand(true);
  const handler = ROUTES[`${group}:${sub}`];

  if (!handler) {
    await interaction.editReply({ content: phrases["error.unknown"] });
    return;
  }

  await handler(interaction);
}

// =========================================================================================================
// Exports
// =========================================================================================================

export const command: Command = { data, execute };
