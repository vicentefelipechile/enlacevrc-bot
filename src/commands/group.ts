// =========================================================================================================
// Group Command
// =========================================================================================================
// Manages VRChat group actions (invite, kick, view permissions) for a group linked to this Discord
// server. Requires the Administrator permission. The group option autocompletes from the per-guild
// VRChat group cache on the client.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  Colors,
  EmbedBuilder,
  Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

import permissions from "../data/permissions.json" with { type: "json" };
import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { printMessage } from "../lib/logger.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import type { BotClient } from "../types/client.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SUBCOMMAND = {
  INVITE: "invite",
  KICK: "kick",
  VIEWPERMISSIONS: "viewpermissions",
  LEAVE: "leave",
} as const;

const PERMISSIONS_DATA = Object.fromEntries(
  permissions.map((permission) => [permission.name, permission]),
);

const PERMISSION = {
  INVITE: "group-invites-manage",
  KICK: "group-members-remove",
} as const;

const MAX_AUTOCOMPLETE_RESULTS = 25;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.general": "An error occurred while processing the request. Please try again later.",
    "error.not_linked":
      "You need to link your VRChat account first. Use `/verification` to get started.",
    "error.group_not_linked":
      'The VRChat group "{groupId}" is not linked to this Discord server. Use `/linkgroup` to link it first.',
    "error.no_permission":
      "The bot does not have the necessary permissions to perform this action in the VRChat group.",
    "error.user_not_found": 'The user "{username}" was not found on VRChat.',
    "error.invite_failed": "Failed to invite the user to the group.",
    "error.kick_failed": "Failed to kick the user from the group.",
    "success.invite": "✅ Successfully invited **{username}** to the group **{groupName}**.",
    "success.kick": "✅ Successfully kicked **{username}** from the group **{groupName}**.",
    "error.leave_failed": "Failed to leave the group.",
    "success.leave":
      "✅ The bot has left the group **{groupName}** and all its data has been removed from this server.",
    "permissions.title": "🔐 Bot Permissions in {groupName}",
    "permissions.available": "## ✅ Available permissions:",
    "permissions.missing": "## ❌ Missing permissions:",
    "permissions.none": "_None_",
    "permissions.invite": `\`/group invite\`: ${PERMISSIONS_DATA[PERMISSION.INVITE]?.displayName}`,
    "permissions.kick": `\`/group kick\`: ${PERMISSIONS_DATA[PERMISSION.KICK]?.displayName}`,
  },
  [Locale.SpanishLATAM]: {
    "error.general": "Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.",
    "error.not_linked":
      "Primero necesitas vincular tu cuenta de VRChat. Usa `/verification` para comenzar.",
    "error.group_not_linked":
      'El grupo de VRChat "{groupId}" no está vinculado a este servidor de Discord. Usa `/linkgroup` para vincularlo primero.',
    "error.no_permission":
      "El bot no tiene los permisos necesarios para realizar esta acción en el grupo de VRChat.",
    "error.user_not_found": 'El usuario "{username}" no fue encontrado en VRChat.',
    "error.invite_failed": "No se pudo invitar al usuario al grupo.",
    "error.kick_failed": "No se pudo expulsar al usuario del grupo.",
    "success.invite": "✅ Se invitó exitosamente a **{username}** al grupo **{groupName}**.",
    "success.kick": "✅ Se expulsó exitosamente a **{username}** del grupo **{groupName}**.",
    "error.leave_failed": "No se pudo abandonar el grupo.",
    "success.leave":
      "✅ El bot abandonó el grupo **{groupName}** y se eliminó toda su información de este servidor.",
    "permissions.title": "🔐 Permisos del Bot en {groupName}",
    "permissions.available": "## ✅ Permisos disponibles:",
    "permissions.missing": "## ❌ Permisos faltantes:",
    "permissions.none": "_Ninguno_",
    "permissions.invite": `\`/group invite\`: ${PERMISSIONS_DATA[PERMISSION.INVITE]?.displayName}`,
    "permissions.kick": `\`/group kick\`: ${PERMISSIONS_DATA[PERMISSION.KICK]?.displayName}`,
  },
  [Locale.SpanishES]: {
    "error.general":
      "¡Madre mía! Algo ha fallado al procesar la petición. Prueba otra vez más tarde, colega.",
    "error.not_linked":
      "Primero tienes que vincular tu cuenta de VRChat, chaval. Usa `/verification` para empezar.",
    "error.group_not_linked":
      'El grupo de VRChat "{groupId}" no está vinculado a este server de Discord. Usa `/linkgroup` para vincularlo primero, figura.',
    "error.no_permission":
      "¡Nanay! El bot no tiene los permisos necesarios para hacer esto en el grupo de VRChat.",
    "error.user_not_found": 'El usuario "{username}" no se encuentra en VRChat, macho.',
    "error.invite_failed": "¡Joder! No se ha podido invitar al usuario al grupo.",
    "error.kick_failed": "¡Me cago en diez! No se ha podido expulsar al usuario del grupo.",
    "success.invite":
      "✅ ¡De lujo! Se ha invitado a **{username}** al grupo **{groupName}**, como Dios manda.",
    "success.kick": "✅ ¡Hecho! Se ha expulsado a **{username}** del grupo **{groupName}**, tronco.",
    "error.leave_failed": "¡Joder! No se ha podido abandonar el grupo.",
    "success.leave":
      "✅ ¡Hala! El bot se ha pirado del grupo **{groupName}** y se ha borrado toda su info de este server.",
    "permissions.title": "🔐 Permisos del Bot en {groupName}",
    "permissions.available": "## ✅ Permisos disponibles:",
    "permissions.missing": "## ❌ Permisos faltantes:",
    "permissions.none": "_Ninguno_",
    "permissions.invite": `\`/group invite\`: ${PERMISSIONS_DATA[PERMISSION.INVITE]?.displayName}`,
    "permissions.kick": `\`/group kick\`: ${PERMISSIONS_DATA[PERMISSION.KICK]?.displayName}`,
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

interface ResolvedUser {
  id: string;
  displayName: string;
}

/** Subset of the VRChat group object this command reads. */
interface VRChatGroupData {
  name: string;
  iconUrl?: string;
  myMember: { permissions: string[] };
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** True when the VRChat group is linked to the given Discord server. */
async function isGroupLinked(
  groupId: string,
  serverId: string,
  userRequestData: { discord_id: string; discord_name: string },
): Promise<boolean> {
  try {
    const serverData = await D1Class.getVRChatGroupServer(userRequestData, groupId);
    return serverData.discord_server_id === serverId;
  } catch {
    return false;
  }
}

/** Resolves a VRChat username or user ID into an id + display name, throwing when not found. */
async function resolveUser(userInput: string): Promise<ResolvedUser> {
  if (userInput.startsWith("usr_")) {
    const response = await VRCHAT_CLIENT.getUser({ path: { userId: userInput } });
    const user = response.data as unknown as ResolvedUser;
    return { id: user.id, displayName: user.displayName };
  }

  const search = await VRCHAT_CLIENT.searchUsers({ query: { search: userInput, n: 1 } });
  const results = search.data as unknown as ResolvedUser[] | undefined;
  if (!results || results.length === 0) {
    throw new Error("User not found");
  }

  const first = results[0]!;
  return { id: first.id, displayName: first.displayName };
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("group")
  .setDescription("Manage VRChat group actions.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Administra acciones del grupo de VRChat.",
    [Locale.SpanishES]: "Administra tu grupo de VRChat, tronco.",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.INVITE)
      .setDescription("Invite a user to the VRChat group")
      .addStringOption((opt) =>
        opt.setName("group").setDescription("The VRChat group ID").setRequired(true).setAutocomplete(true),
      )
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to invite").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.KICK)
      .setDescription("Kick a user from the VRChat group")
      .addStringOption((opt) =>
        opt.setName("group").setDescription("The VRChat group ID").setRequired(true).setAutocomplete(true),
      )
      .addUserOption((opt) => opt.setName("user").setDescription("User to kick").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.VIEWPERMISSIONS)
      .setDescription("View the bot's current permissions in the VRChat group")
      .addStringOption((opt) =>
        opt.setName("group").setDescription("The VRChat group ID").setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName(SUBCOMMAND.LEAVE)
      .setDescription("Leave the VRChat group and remove all of its data from this server")
      .addStringOption((opt) =>
        opt.setName("group").setDescription("The VRChat group ID").setRequired(true).setAutocomplete(true),
      ),
  );

async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused(true);
  if (focused.name !== "group" || !interaction.guildId) {
    return;
  }

  const client = interaction.client as BotClient;
  const groups = client.vrchatGroups.get(interaction.guildId) ?? [];
  const search = focused.value.toLowerCase();

  const matches = groups
    .filter((group) => group.group_name.toLowerCase().includes(search))
    .slice(0, MAX_AUTOCOMPLETE_RESULTS)
    .map((group) => ({ name: group.group_name, value: group.vrchat_group_id }));

  try {
    await interaction.respond(matches);
  } catch (error) {
    printMessage("Group autocomplete error:", String(error));
  }
}

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);

  if (!interaction.guild) {
    await interaction.editReply({ content: phrases["error.general"] });
    return;
  }

  const serverId = interaction.guild.id;
  const subcommand = interaction.options.getSubcommand();
  const groupId = interaction.options.getString("group", true);
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  try {
    let profileData;
    try {
      profileData = await D1Class.getProfile(userRequestData, interaction.user.id, false);
    } catch {
      profileData = null;
    }

    if (!profileData?.vrchat_id) {
      await interaction.editReply({
        content: phrases["error.not_linked"],
      });
      return;
    }

    if (!(await isGroupLinked(groupId, serverId, userRequestData))) {
      await interaction.editReply({
        content: phrases["error.group_not_linked"].replace("{groupId}", groupId),
      });
      return;
    }

    const groupResponse = await VRCHAT_CLIENT.getGroup({ path: { groupId } });
    const groupData = groupResponse.data as unknown as VRChatGroupData;

    switch (subcommand) {
      case SUBCOMMAND.INVITE:
        await runMembership(interaction, phrases, groupData, groupId, "invite");
        break;
      case SUBCOMMAND.KICK:
        await runMembership(interaction, phrases, groupData, groupId, "kick");
        break;
      case SUBCOMMAND.VIEWPERMISSIONS:
        await runViewPermissions(interaction, phrases, groupData, groupId);
        break;
      case SUBCOMMAND.LEAVE:
        await runLeave(interaction, phrases, groupData, groupId, serverId, userRequestData);
        break;
      default:
        break;
    }
  } catch (error) {
    printMessage("Group command error:", String(error));
    await interaction.editReply({
      content: phrases["error.general"],
    });
  }
}

/** Handles the invite/kick subcommands, which share permission check + user resolution + error paths. */
async function runMembership(
  interaction: ChatInputCommandInteraction,
  phrases: Phrases,
  groupData: VRChatGroupData,
  groupId: string,
  action: "invite" | "kick",
): Promise<void> {
  const requiredPermission = action === "invite" ? PERMISSION.INVITE : PERMISSION.KICK;
  if (!groupData.myMember.permissions.includes(requiredPermission)) {
    await interaction.editReply({
      content: phrases["error.no_permission"],
    });
    return;
  }

  const userInput = interaction.options.getUser("user", true).id;

  try {
    const targetUser = await resolveUser(userInput);

    if (action === "invite") {
      // Bug fix: the SDK method is createGroupInvite (the original used a non-existent name).
      await VRCHAT_CLIENT.createGroupInvite({
        path: { groupId },
        body: { userId: targetUser.id },
      });
    } else {
      // Bug fix: the SDK method is kickGroupMember (the original used a non-existent name).
      await VRCHAT_CLIENT.kickGroupMember({ path: { groupId, userId: targetUser.id } });
    }

    const successKey = action === "invite" ? "success.invite" : "success.kick";
    await interaction.editReply({
      content: phrases[successKey]
        .replace("{username}", targetUser.displayName)
        .replace("{groupName}", groupData.name),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      await interaction.editReply({
        content: phrases["error.user_not_found"].replace("{username}", userInput),
      });
      return;
    }
    printMessage(`Error during group ${action}:`, String(error));
    const failKey = action === "invite" ? "error.invite_failed" : "error.kick_failed";
    await interaction.editReply({
      content: phrases[failKey],
    });
  }
}

/** Renders the bot's invite/kick permission status for the group. */
async function runViewPermissions(
  interaction: ChatInputCommandInteraction,
  phrases: Phrases,
  groupData: VRChatGroupData,
  groupId: string,
): Promise<void> {
  const canInvite = groupData.myMember.permissions.includes(PERMISSION.INVITE);
  const canKick = groupData.myMember.permissions.includes(PERMISSION.KICK);

  const available: string[] = [];
  const missing: string[] = [];
  (canInvite ? available : missing).push(`- ${phrases["permissions.invite"]}`);
  (canKick ? available : missing).push(`- ${phrases["permissions.kick"]}`);

  const description =
    `${phrases["permissions.available"]}\n` +
    `${available.length > 0 ? available.join("\n") : phrases["permissions.none"]}\n\n` +
    `${phrases["permissions.missing"]}\n` +
    `${missing.length > 0 ? missing.join("\n") : phrases["permissions.none"]}`;

  const guildIcon = interaction.guild?.iconURL() ?? undefined;
  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle(phrases["permissions.title"].replace("{groupName}", groupData.name))
    .setDescription(description)
    .setTimestamp()
    .setFooter(guildIcon ? { text: `Group ID: ${groupId}`, iconURL: guildIcon } : { text: `Group ID: ${groupId}` });

  if (groupData.iconUrl) {
    embed.setThumbnail(groupData.iconUrl);
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Leaves the VRChat group and removes all of its data from the backend. The VRChat-side leave is
 * attempted first; only if that succeeds do we delete the backend record, so we never orphan a group
 * that the bot is still a member of.
 */
async function runLeave(
  interaction: ChatInputCommandInteraction,
  phrases: Phrases,
  groupData: VRChatGroupData,
  groupId: string,
  serverId: string,
  userRequestData: { discord_id: string; discord_name: string },
): Promise<void> {
  try {
    await VRCHAT_CLIENT.leaveGroup({ path: { groupId } });
    await D1Class.deleteVRChatGroup(userRequestData, groupId);

    // Refresh the in-memory group cache the `/group` autocomplete reads from, so the removed group
    // stops being selectable immediately instead of only after the next restart.
    try {
      const client = interaction.client as BotClient;
      const groups = await D1Class.listVRChatGroups(userRequestData, serverId, false);
      client.vrchatGroups.set(serverId, groups);
    } catch (error) {
      printMessage("Failed to refresh group cache after leave:", String(error));
    }

    try {
      await D1Class.logVRChatGroup(
        userRequestData,
        groupId,
        serverId,
        `Bot left group and removed all data (requested by ${userRequestData.discord_name})`,
      );
    } catch (error) {
      printMessage("Failed to log group leave:", String(error));
    }

    await interaction.editReply({
      content: phrases["success.leave"].replace("{groupName}", groupData.name),
    });
  } catch (error) {
    printMessage("Error during group leave:", String(error));
    await interaction.editReply({
      content: phrases["error.leave_failed"],
    });
  }
}

export const command: Command = { data, execute, autocomplete };
