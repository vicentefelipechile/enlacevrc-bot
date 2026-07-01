// =========================================================================================================
// Sync Command
// =========================================================================================================
// Synchronizes the invoking member's roles and nickname with their verified VRChat profile: grants the
// verification role, optionally the 18+ role, and updates the nickname when the server enables it.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Colors, ContainerBuilder, Locale, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { syncMember } from "../lib/sync-member.js";
import type { SyncResult } from "../lib/sync-member.js";
import { buildContainer, textContainer } from "../ui/container.js";


// =========================================================================================================
// Constants
// =========================================================================================================

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_profile":
      "You do not have a linked VRChat profile. Please use `/verification` first.",
    "error.banned": "You are banned from the system and cannot sync.",
    "success.title": "Synchronization Complete",
    "success.description": "Your profile has been synchronized successfully.",
    "success.roles_title": "Roles Added",
    "success.nickname_title": "Nickname Updated",
    "success.no_changes": "Your profile is already up to date.",
    "log.role_fail": "Failed to add role {role}: {error}",
    "log.nickname_fail": "Failed to update nickname: {error}",
    "log.plus_role_fail": "Failed to add plus role {role}: {error}",
    "error.bot_no_perm": 'I do not have the "Manage Roles" permission.',
    "error.role_hierarchy":
      "I cannot assign role {role} because it is higher than my highest role.",
    "solution.bot_no_perm":
      'Please ensure I have the "Manage Roles" permission in the server settings.',
    "solution.role_hierarchy":
      "Please move my role above the {role} role in the server settings.",
  },
  [Locale.SpanishLATAM]: {
    "error.no_profile":
      "No tienes un perfil de VRChat vinculado. Por favor, usa `/verification` primero.",
    "error.banned": "Estás baneado del sistema y no puedes sincronizar.",
    "success.title": "Sincronización Completada",
    "success.description": "Tu perfil ha sido sincronizado exitosamente.",
    "success.roles_title": "Roles Añadidos",
    "success.nickname_title": "Apodo Actualizado",
    "success.no_changes": "Tu perfil ya está actualizado.",
    "log.role_fail": "No se pudo añadir el rol {role}: {error}",
    "log.nickname_fail": "No se pudo actualizar el apodo: {error}",
    "log.plus_role_fail": "No se pudo añadir el rol 18+: {error}",
    "error.bot_no_perm": 'No tengo el permiso "Gestionar Roles".',
    "error.role_hierarchy":
      "No puedo asignar el rol {role} porque es superior a mi rol más alto.",
    "solution.bot_no_perm":
      'Por favor, asegúrate de que tengo el permiso "Gestionar Roles" en la configuración del servidor.',
    "solution.role_hierarchy":
      "Por favor, mueve mi rol por encima del rol {role} en la configuración del servidor.",
  },
  [Locale.SpanishES]: {
    "error.no_profile":
      "¡Que no tienes perfil vinculado, alma de cántaro! Usa `/verification` antes.",
    "error.banned": "Estás baneado, colega. Aquí no se sincroniza nada.",
    "success.title": "¡Sincronización al Pelo!",
    "success.description": "Tu perfil se ha quedado niquelado.",
    "success.roles_title": "Roles que te han caído",
    "success.nickname_title": "Apodo nuevo",
    "success.no_changes": "¡Pero si ya estás perfecto! No hay nada que cambiar.",
    "log.role_fail": "¡Ostras! No he podido ponerte el rol {role}: {error}",
    "log.nickname_fail": "¡Joder! No he podido cambiarte el apodo: {error}",
    "log.plus_role_fail": "¡Joder! No he podido ponerte el rol 18+: {error}",
    "error.bot_no_perm": "No tengo permisos para gestionar roles, ¿qué te crees?",
    "error.role_hierarchy": "El rol {role} está por encima de mí, no puedo dártelo.",
    "solution.bot_no_perm": 'Dame permisos de "Gestionar Roles" o no hacemos nada.',
    "solution.role_hierarchy": "Sube mi rol por encima de {role}, que si no, no llego.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

/** The success-summary strings `buildSyncResultContainer` reads (the error strings come from `SyncResult`). */
export type SyncResultPhrases = Pick<
  Phrases,
  | "success.title"
  | "success.description"
  | "success.roles_title"
  | "success.nickname_title"
  | "success.no_changes"
>;

// =========================================================================================================
// Localization
// =========================================================================================================

/**
 * Localizes the sync phrase table for a given locale. Exported so other entry points into the sync flow
 * (the welcome panel's Sync button) reuse the exact same strings the `/sync` command uses, instead of
 * maintaining a parallel copy.
 */
export function localizeSync(locale: Locale): Phrases {
  return localize(locale);
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("sync")
  .setDescription("Synchronize your roles and nickname with your VRChat profile.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Sincroniza tus roles y apodo con tu perfil de VRChat.",
    [Locale.SpanishES]: "Sincroniza tus roles y apodo con tu perfil de VRChat, ¡así de fácil!",
  });

/**
 * Renders a `SyncResult` into a Components V2 container: a red error card, or a green summary listing the
 * roles/nickname that changed (or "already up to date"). Exported so the welcome panel's Sync button
 * presents identical output to the `/sync` command.
 */
export function buildSyncResultContainer(result: SyncResult, phrases: SyncResultPhrases): ContainerBuilder {
  if (!result.ok) {
    return buildContainer({
      color: Colors.Red,
      title: result.error.title,
      description: result.error.description,
    });
  }

  const { changes } = result;
  const sections: string[] = [];

  if (changes.rolesAdded.length > 0) {
    sections.push(
      `**${phrases["success.roles_title"]}**` +
        changes.rolesAdded.map((role) => `\n- ${role}`).join(""),
    );
  }

  if (changes.nicknameUpdated && changes.nickname) {
    sections.push(`**${phrases["success.nickname_title"]}**\n${changes.nickname}`);
  }

  const description =
    sections.length > 0
      ? `${phrases["success.description"]}\n\n${sections.join("\n\n")}`
      : phrases["success.no_changes"];

  return buildContainer({ color: Colors.Green, title: phrases["success.title"], description });
}

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  // Sync only makes sense inside a guild with a resolved member.
  if (!interaction.guild || !interaction.member) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.no_profile"], Colors.Red)],
    });
    return;
  }

  const guild = interaction.guild;
  const requestData = { discord_id: interaction.user.id, discord_name: interaction.user.username };
  const member = await guild.members.fetch(interaction.user.id);

  const result = await syncMember(guild, member, requestData, phrases);

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [buildSyncResultContainer(result, phrases)],
  });
}

export const command: Command = { data, execute };
