// =========================================================================================================
// View Profile Command
// =========================================================================================================
// Shows another user's VRChat profile if that user is verified. Rejects bots and the command author.

// =========================================================================================================
// Imports
// =========================================================================================================

import { Colors, Locale, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { env } from "../config/env.js";
import { createLocalizer } from "../lib/i18n.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { textContainer } from "../ui/container.js";
import { formatProfileEmbed } from "../ui/profile.js";
import type { VRChatUser } from "../ui/profile.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.not_verified_user":
      "This user is not verified. They need to link their VRChat account using the `/verification` command first.",
    "error.is_the_bot": "You cannot view the bot's profile. It is personality-less!",
    "error.is_bot": "Discord Bots don't have VRChat profiles to view!",
    success: "Showing {target}'s VRChat profile:",
    "button.view_profile": "View Profile",
    "button.view_personality": "View Personality",
    "embed.nostatus": "No status",
    "embed.nopronouns": "Not specified",
    "embed.verification_by": "Verified by <@{discord_id}>",
    "embed.banned": "Banned!",
    "embed.banned_by":
      "Banned by <@{banned_by}>\nReason: **{banned_reason}**\nBanned at {banned_at}",
    "embed.nobio": "No biography.",
    "embed.header": "# [{profile_name}]({profile_url})",
    "embed.bio_title": "### 📖 Biography",
    "embed.fields": "**Status** ・ {profile_status}\n**Pronouns** ・ {profile_wokestuff}",
  },
  [Locale.SpanishLATAM]: {
    "error.not_verified_user":
      "Este usuario no está verificado. Primero necesita vincular su cuenta de VRChat usando el comando `/verification`.",
    "error.is_the_bot": "No puedes ver el perfil del bot. ¡No tiene personalidad!",
    "error.is_bot": "¡Los bots de Discord no tienen perfiles de VRChat para ver!",
    success: "Mostrando el perfil de VRChat de {target}:",
    "button.view_profile": "Ver perfil",
    "button.view_personality": "Ver personalidad",
    "embed.nostatus": "Sin estado",
    "embed.nopronouns": "No especificado",
    "embed.verification_by": "Verificado por <@{discord_id}>",
    "embed.banned": "¡Baneado!",
    "embed.banned_by":
      "Baneado por <@{banned_by}>\nRazón: **{banned_reason}**\nBaneado el {banned_at}",
    "embed.nobio": "Sin biografía.",
    "embed.header": "# [{profile_name}]({profile_url})",
    "embed.bio_title": "### 📖 Biografía",
    "embed.fields": "**Estado** ・ {profile_status}\n**Pronombres** ・ {profile_wokestuff}",
  },
  [Locale.SpanishES]: {
    "error.not_verified_user":
      "¡Eh, para el carro! Este tío no está verificado. Que se vincule la cuenta de VRChat con el comando `/verification` antes de nada.",
    "error.is_the_bot":
      "¡Compañero! ¿Pero cómo vas a ver el perfil del bot? ¡Si no tiene ni media neurona!",
    "error.is_bot": "¡Los bots de Discord no tienen perfiles de VRChat para cotillear, alma de cántaro!",
    success: "¡Dale, dale! Aquí tienes el perfil de {target} para que cotillees a gusto.",
    "button.view_profile": "Ver perfil",
    "button.view_personality": "Ver personalidad",
    "embed.nostatus": "Sin estado",
    "embed.nopronouns": "No especificao",
    "embed.verification_by": "Verificao por <@{discord_id}>",
    "embed.banned": "¡Baneado chaval!",
    "embed.banned_by":
      "Baneado por <@{banned_by}>\nRazón: **{banned_reason}**\nBaneado el {banned_at}",
    "embed.nobio": "El colega no ha escrito ni una mísera línea.",
    "embed.header": "# [{profile_name}]({profile_url})",
    "embed.bio_title": "### 📖 La flipante vida del colega",
    "embed.fields": "**Estado** ・ {profile_status}\n**Pronombres** ・ {profile_wokestuff}",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("viewprofile")
  .setDescription("View another user's VRChat profile.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Ver el perfil de VRChat de otro usuario.",
    [Locale.SpanishES]: "Para cotillear el perfil de VRChat de otro pavo.",
  })
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user whose VRChat profile you want to view.")
      .setRequired(true),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const targetUser = interaction.options.getUser("user", true);

  if (targetUser.id === env.DISCORD_CLIENT_ID) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.is_the_bot"], Colors.Red)],
    });
    return;
  }

  if (targetUser.bot) {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.is_bot"], Colors.Red)],
    });
    return;
  }

  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, targetUser.id);
  } catch {
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [textContainer(phrases["error.not_verified_user"], Colors.Red)],
    });
    return;
  }

  const vrchatResponse = await VRCHAT_CLIENT.getUser({ path: { userId: profileData.vrchat_id } });
  const vrchatData = vrchatResponse.data as unknown as VRChatUser;

  const profileEmbed = formatProfileEmbed(vrchatData, profileData, phrases);

  await interaction.editReply({
    components: [profileEmbed],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
  });
}

export const command: Command = { data, execute };
