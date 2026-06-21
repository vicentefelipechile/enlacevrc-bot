// =========================================================================================================
// Profile Command
// =========================================================================================================
// Displays the invoking user's own VRChat profile if they are verified, otherwise offers a button to
// start verification.

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  Locale,
  MessageFlags,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Command } from "./types.js";
import { createLocalizer } from "../lib/i18n.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { formatProfileEmbed } from "../ui/profile.js";
import type { VRChatUser } from "../ui/profile.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const VERIFICATION_BUTTON_ID = "verification_profile";

const localize = createLocalizer({
  [Locale.EnglishUS]: {
    "error.not_verified":
      "You are not verified. Please use the `/{command}` command to link your VRChat account or press the button below to start the verification process.",
    "button.verify": "Verify",
    "button.view_profile": "View Profile",
    "button.view_personality": "View Personality",
    "embed.nostatus": "No status",
    "embed.nopronouns": "Not specified",
    "embed.verification_code_detected":
      "I noticed that you still have the code {code} in your VRChat biography. Once verified, there is no need to keep it there.",
    "embed.verification_by": "Verified by <@{discord_id}>",
    "embed.banned": "Banned!",
    "embed.banned_by":
      "Banned by <@{banned_by}>\nReason: **{banned_reason}**\nBanned at {banned_at}",
    "embed.body":
      "# [{profile_name}]({profile_url})\n\n## Biography\n\n{profile_bio}\n\n**Status**: {profile_status}\n**Pronouns**: {profile_wokestuff}",
  },
  [Locale.SpanishLATAM]: {
    "error.not_verified":
      "No estás verificado. Por favor, usa el comando `/{command}` para vincular tu cuenta de VRChat o presiona el botón de abajo para iniciar el proceso de verificación.",
    "button.verify": "Verificar",
    "button.view_profile": "Ver perfil",
    "button.view_personality": "Ver personalidad",
    "embed.nostatus": "Sin estado",
    "embed.nopronouns": "No especificado",
    "embed.verification_code_detected":
      "He notado que aún tienes el código {code} en tu biografía de VRChat. Una vez verificado no hace falta mantenerlo.",
    "embed.verification_by": "Verificado por <@{discord_id}>",
    "embed.banned": "¡Baneado!",
    "embed.banned_by":
      "Baneado por <@{banned_by}>\nRazón: **{banned_reason}**\nBaneado el {banned_at}",
    "embed.body":
      "# [{profile_name}]({profile_url})\n\n## Biografía\n\n{profile_bio}\n\n**Estado**: {profile_status}\n**Pronombres**: {profile_wokestuff}",
  },
  [Locale.SpanishES]: {
    "error.not_verified":
      "¡Madre mía Willy! ¡Que no estás verificao, chaval! Tira pa lante con el comando `/{command}` para vincular tu cuenta o dale al botón de abajo.",
    "button.verify": "Verificar",
    "button.view_profile": "Ver perfil",
    "button.view_personality": "Ver personalidad",
    "embed.nostatus": "Sin estado",
    "embed.nopronouns": "No especificao",
    "embed.verification_code_detected":
      "¡Oye, mira que eres lerdo! Que aún llevas el código {code} en la biografía de VRChat. Una vez verificao, quítate eso del medio, que ocupa.",
    "embed.verification_by": "Verificao por <@{discord_id}>",
    "embed.banned": "¡Baneado chaval!",
    "embed.banned_by":
      "Baneado por <@{banned_by}>\nRazón: **{banned_reason}**\nBaneado el {banned_at}",
    "embed.body":
      "# [{profile_name}]({profile_url})\n\n## La flipante vida del colega\n\n{profile_bio}\n\n**Estado**: {profile_status}\n**Pronombres**: {profile_wokestuff}",
  },
});

// =========================================================================================================
// Main
// =========================================================================================================

const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Display your profile information.")
  .setDescriptionLocalizations({
    [Locale.SpanishLATAM]: "Muestra la información de tu perfil.",
    [Locale.SpanishES]: "Chaval, este comando te muestra la info de tu perfil, que eres un cotilla.",
  });

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const phrases = localize(interaction.locale);
  const userRequestData = {
    discord_id: interaction.user.id,
    discord_name: interaction.user.username,
  };

  let profileData;
  try {
    profileData = await D1Class.getProfile(userRequestData, interaction.user.id);
  } catch {
    // Not verified: offer a button that routes to the verification command's flow. Built as a
    // Components V2 container so the button's onProfile handler (which edits this message into a
    // V2 video container) stays within V2 — the IS_COMPONENTS_V2 flag is immutable once set.
    const verifyButton = new ButtonBuilder()
      .setLabel(phrases["button.verify"])
      .setStyle(ButtonStyle.Primary)
      .setCustomId(VERIFICATION_BUTTON_ID);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          phrases["error.not_verified"].replace("{command}", "verification"),
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton),
      );

    await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
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
