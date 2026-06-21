// =========================================================================================================
// Verify User Command
// =========================================================================================================
// Staff-only command to grant a member the server's 18+ verification role, ensuring they have a linked
// VRChat profile and the base verification role first, and marking them 18+ verified in the database.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  AttachmentBuilder,
  Colors,
  EmbedBuilder,
  Locale,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";

import type { Command } from "./types.js";
import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { createLocalizer } from "../lib/i18n.js";
import { getRandomColor } from "../lib/random-color.js";
import { D1Class } from "../services/d1.js";
import type { Profile } from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const ERROR_IMAGE_FILE = "img/error.jpg";
const ERROR_IMAGE_NAME = "error.jpg";
const ERROR_IMAGE_URL = `attachment://${ERROR_IMAGE_NAME}`;

// Verification method id recorded when staff grant 18+ access.
const STAFF_VERIFICATION_ID = 1;

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.no_permission": "You do not have permission to use this command.",
    "error.user_not_verified_title": "❌ VRChat Account Not Linked",
    "error.user_not_verified":
      "The user must link their VRChat account to their Discord account before receiving +18 verification.",
    "error.role_not_found_title": "❌ Role Not Found",
    "error.role_not_found": "The configured +18 verification role was not found in the server.",
    "error.already_verified_title": "❌ Already Verified",
    "error.user_already_has_role": "The user already has the +18 verification role.",
    "error.assignment_failed_title": "❌ Role Assignment Failed",
    "error.failed_to_assign": "Failed to assign the +18 verification role to the user.",
    "error.chat_is_dm": "This command can only be used in a server.",
    "success.title": "✅ User Verified for +18 Access",
    "success.description":
      "Successfully verified **{username}** for +18 access and assigned the role.",
    "success.footer": "Verification completed by {moderator}",
    "success_already.title": "✅ User Already Verified for +18 Access",
    "success_already.description":
      "The user **{username}** is already verified for +18 access and now has the role.",
  },
  [Locale.SpanishLATAM]: {
    "error.no_permission": "No tienes permisos para utilizar este comando.",
    "error.user_not_verified_title": "❌ Cuenta de VRChat No Vinculada",
    "error.user_not_verified":
      "El usuario debe vincular su cuenta de VRChat con su cuenta de Discord antes de recibir la verificación +18.",
    "error.role_not_found_title": "❌ Rol No Encontrado",
    "error.role_not_found": "El rol de verificación +18 configurado no fue encontrado en el servidor.",
    "error.already_verified_title": "❌ Ya Verificado",
    "error.user_already_has_role": "El usuario ya tiene el rol de verificación +18.",
    "error.assignment_failed_title": "❌ Fallo al Asignar Rol",
    "error.failed_to_assign": "No se pudo asignar el rol de verificación +18 al usuario.",
    "error.chat_is_dm": "Este comando solo puede ser utilizado en un servidor.",
    "success.title": "✅ Usuario Verificado para Acceso +18",
    "success.description":
      "Se verificó exitosamente a **{username}** para acceso +18 y se asignó el rol.",
    "success.footer": "Verificación completada por {moderator}",
    "success_already.title": "✅ Usuario ya está verificado para el Acceso +18",
    "success_already.description":
      "El usuario **{username}** ya está verificado para el Acceso +18, se le ha dado el rol.",
  },
  [Locale.SpanishES]: {
    "error.no_permission": "¡Joder tío, no tienes permisos pa usar este comando, chaval!",
    "error.user_not_verified_title": "❌ ¡Cuéntame, la Cuenta de VRChat No Está Vinculá, eh!",
    "error.user_not_verified":
      "¡Joder, vaya tela! El fulano tiene que vincular su cuenta de VRChat con Discord antes de que le dé la verificación +18.",
    "error.role_not_found_title": "❌ ¡Que Se Lo Llevó El Viento al Rol!",
    "error.role_not_found":
      "¡Ay, ostras chaval! ¡Joder! No encontramos el rol de verificación +18 por ningún lado en el servidor.",
    "error.already_verified_title": "❌ ¡Que Ya Está Verificao, Macho!",
    "error.user_already_has_role": "¡Vamos tío! ¡Que ya tiene el rol de verificación +18 el fulano!",
    "error.assignment_failed_title": "❌ ¡Se Ha Liado la Cosa con el Rol, Vaya!",
    "error.failed_to_assign":
      "¡Ay, que no se pudo asignar el rol, tío! ¡Joder, qué cosa tan rara! ¡Madre mía!",
    "error.chat_is_dm": "¡Pero huele que estás en un DM, tío! ¡Madre mía!",
    "success.title": "✅ ¡Tío Verificao Pa los +18, Olé!",
    "success.description":
      "¡Vaya! ¡Ostras, chaval! Se verificó exitosamente a **{username}** pa acceso +18 y se le asignó el rol.",
    "success.footer": "¡Verificación completá por {moderator}, joder, que bien! ¡Olé!",
    "success_already.title": "✅ ¡Tío Verificao Pa los +18, Olé!",
    "success_already.description":
      "¡Vaya! ¡Ostras, chaval! Se verificó exitosamente a **{username}** pa acceso +18 y se le asignó el rol.",
  },
});

// =========================================================================================================
// Types
// =========================================================================================================

type Phrases = ReturnType<typeof localize>;

// =========================================================================================================
// Helpers
// =========================================================================================================

/** True when the invoking user is registered staff. */
async function isStaff(userId: string, username: string): Promise<boolean> {
  try {
    const staff = await D1Class.getStaff({ discord_id: userId, discord_name: username }, userId);
    return staff !== null;
  } catch {
    return false;
  }
}

function errorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(Colors.Red)
    .setThumbnail(ERROR_IMAGE_URL)
    .setTimestamp();
  if (description) {
    embed.setDescription(description);
  }
  return embed;
}

function successEmbed(
  member: GuildMember,
  phrases: Phrases,
  titleKey: "success.title" | "success_already.title",
  descriptionKey: "success.description" | "success_already.description",
  moderatorName: string,
  moderatorAvatar: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(phrases[titleKey])
    .setDescription(phrases[descriptionKey].replace("{username}", member.displayName))
    .setColor(getRandomColor())
    .setThumbnail(member.displayAvatarURL())
    .setFooter({
      text: phrases["success.footer"].replace("{moderator}", moderatorName),
      iconURL: moderatorAvatar,
    })
    .setTimestamp();
}

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("verifyuser")
  .setDescription("Verify a user for +18 access (Moderator only).")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Verificar un usuario para acceso +18 (Solo moderadores).",
    [Locale.SpanishES]: "¡Verificar un tío para acceso +18 (Solo moderadores, joder)!",
  })
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to verify for +18 access.").setRequired(true),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const errorImage = new AttachmentBuilder(ERROR_IMAGE_FILE, { name: ERROR_IMAGE_NAME });

  if (!(await isStaff(interaction.user.id, interaction.user.username))) {
    await interaction.editReply({ content: phrases["error.no_permission"] });
    return;
  }

  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [errorEmbed(phrases["error.chat_is_dm"])],
      files: [errorImage],
    });
    return;
  }

  const guild = interaction.guild;
  const targetUser = interaction.options.getUser("user", true);
  const member = await guild.members.fetch(targetUser.id);

  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData: Profile;
  try {
    profileData = await D1Class.getProfile(userRequestData, targetUser.id, false);
  } catch {
    await interaction.editReply({
      embeds: [
        errorEmbed(phrases["error.user_not_verified_title"], phrases["error.user_not_verified"]),
      ],
      files: [errorImage],
    });
    return;
  }

  const settings = await D1Class.getAllDiscordSettings(userRequestData, guild.id);
  const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
  const verificationPlusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];

  await guild.roles.fetch();

  const verificationRole = verificationRoleId
    ? guild.roles.cache.get(verificationRoleId)
    : undefined;
  const verificationPlusRole = verificationPlusRoleId
    ? guild.roles.cache.get(verificationPlusRoleId)
    : undefined;

  if (!verificationRole || !verificationPlusRole) {
    await interaction.editReply({
      embeds: [errorEmbed(phrases["error.role_not_found_title"], phrases["error.role_not_found"])],
      files: [errorImage],
    });
    return;
  }

  const hasVerificationRole = verificationRole.members.has(targetUser.id);
  const hasPlusRole = verificationPlusRole.members.has(targetUser.id);

  // Ensure the base verification role is present.
  if (!hasVerificationRole) {
    await member.roles.add(verificationRole.id);
  }

  // Stale plus role without DB verification: revoke it.
  if (hasPlusRole && !profileData.is_verified) {
    await member.roles.remove(verificationPlusRole.id);
  }

  // Verified in DB but missing the plus role: grant it and report.
  if (!hasPlusRole && profileData.is_verified) {
    await member.roles.add(verificationPlusRole.id);
    await interaction.editReply({
      embeds: [
        successEmbed(
          member,
          phrases,
          "success_already.title",
          "success_already.description",
          interaction.user.displayName,
          interaction.user.displayAvatarURL(),
        ),
      ],
    });
    return;
  }

  // Already has the role and is verified: nothing to do.
  if (hasPlusRole && profileData.is_verified) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(phrases["error.already_verified_title"])
          .setDescription(phrases["error.user_already_has_role"])
          .setColor(Colors.Green)
          .setTimestamp(),
      ],
    });
    return;
  }

  // Grant the plus role and mark the profile 18+ verified.
  try {
    await member.roles.add(verificationPlusRole.id);
    await D1Class.verifyProfile(userRequestData, targetUser.id, {
      verification_id: STAFF_VERIFICATION_ID,
      verified_from: guild.id,
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          member,
          phrases,
          "success.title",
          "success.description",
          interaction.user.displayName,
          interaction.user.displayAvatarURL(),
        ),
      ],
    });
  } catch {
    await interaction.editReply({
      embeds: [
        errorEmbed(phrases["error.assignment_failed_title"], phrases["error.failed_to_assign"]),
      ],
      files: [errorImage],
    });
  }
}

export const command: Command = { data, execute };
