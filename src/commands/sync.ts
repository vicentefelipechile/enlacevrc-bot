// =========================================================================================================
// Sync Command
// =========================================================================================================
// Synchronizes the invoking member's roles and nickname with their verified VRChat profile: grants the
// verification role, optionally the 18+ role, and updates the nickname when the server enables it.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  Colors,
  ContainerBuilder,
  Locale,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction, GuildMember, Role } from "discord.js";

import type { Command } from "./types.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { D1Class } from "../services/d1.js";
import { buildContainer, textContainer } from "../ui/container.js";


// =========================================================================================================
// Constants
// =========================================================================================================

const AUTO_NICKNAME_ENABLED = "1";

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

interface SyncChanges {
  rolesAdded: string[];
  nicknameUpdated: boolean;
  nickname: string | null;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Builds a red error container from a title and description. */
function errorContainer(title: string, description: string): ContainerBuilder {
  return buildContainer({ color: Colors.Red, title, description });
}

/**
 * Attempts to grant a role to the member, respecting role hierarchy. Returns null on success or an
 * error container describing the failure (hierarchy issue or API error).
 */
async function grantRole(
  member: GuildMember,
  botMember: GuildMember,
  role: Role,
  changes: SyncChanges,
  phrases: Phrases,
  failKey: "log.role_fail" | "log.plus_role_fail",
): Promise<ContainerBuilder | null> {
  if (member.roles.cache.has(role.id)) {
    return null;
  }

  if (botMember.roles.highest.position <= role.position) {
    return errorContainer(
      phrases["error.role_hierarchy"].replace("{role}", role.name),
      phrases["solution.role_hierarchy"].replace("{role}", role.name),
    );
  }

  try {
    await member.roles.add(role);
    changes.rolesAdded.push(role.toString());
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorContainer(
      phrases[failKey].replace("{role}", role.name).replace("{error}", message),
      String(error),
    );
  }
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

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  const replyText = (content: string, color: number = Colors.Red): Promise<unknown> =>
    interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(content, color)],
    });

  // Sync only makes sense inside a guild with a resolved member.
  if (!interaction.guild || !(interaction.member instanceof Object)) {
    await replyText(phrases["error.no_profile"]);
    return;
  }

  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, interaction.user.id, true);
  } catch {
    profileData = null;
  }

  if (!profileData) {
    await replyText(phrases["error.no_profile"]);
    return;
  }

  if (profileData.is_banned) {
    await replyText(phrases["error.banned"]);
    return;
  }

  const guild = interaction.guild;
  const settings = await D1Class.getAllDiscordSettings(userRequestData, guild.id);
  const member = await guild.members.fetch(interaction.user.id);
  const botMember = await guild.members.fetchMe();

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [errorContainer(phrases["error.bot_no_perm"], phrases["solution.bot_no_perm"])],
    });
    return;
  }

  const changes: SyncChanges = { rolesAdded: [], nicknameUpdated: false, nickname: null };

  // 1. Basic verification role.
  const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
  if (verificationRoleId) {
    const role = guild.roles.cache.get(verificationRoleId);
    if (role) {
      const failure = await grantRole(member, botMember, role, changes, phrases, "log.role_fail");
      if (failure) {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [failure],
        });
        return;
      }
    }
  }

  // 2. Auto nickname.
  if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === AUTO_NICKNAME_ENABLED) {
    const newNickname = profileData.vrchat_name;
    if (member.nickname !== newNickname && member.user.username !== newNickname) {
      try {
        if (botMember.roles.highest.position > member.roles.highest.position) {
          await member.setNickname(newNickname);
          changes.nicknameUpdated = true;
          changes.nickname = newNickname;
        }
      } catch (error) {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer(phrases["log.nickname_fail"], String(error))],
        });
        return;
      }
    }
  }

  // 3. Plus (18+) verification role.
  if (profileData.is_verified) {
    const plusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];
    if (plusRoleId) {
      const role = guild.roles.cache.get(plusRoleId);
      if (role) {
        const failure = await grantRole(
          member,
          botMember,
          role,
          changes,
          phrases,
          "log.plus_role_fail",
        );
        if (failure) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [failure],
          });
          return;
        }
      }
    }
  }

  // Build the success response.
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

  const hasChanges = sections.length > 0;
  const description = hasChanges
    ? `${phrases["success.description"]}\n\n${sections.join("\n\n")}`
    : phrases["success.no_changes"];

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: [
      buildContainer({ color: Colors.Green, title: phrases["success.title"], description }),
    ],
  });
}

export const command: Command = { data, execute };
