// =========================================================================================================
// Profile Message
// =========================================================================================================
// Fetches a Discord user's linked VRChat profile and builds the shared Components V2 container for it, and
// posts it to a server's configured profile-send channel. Used by non-interaction and reply contexts (the
// verification flow and the sync flow) that want the same profile rendering as `/viewprofile` but without a
// slash-command locale. The phrase table here is fixed to neutral Spanish (LATAM), the project's default
// audience.

// =========================================================================================================
// Imports
// =========================================================================================================

import { MessageFlags } from "discord.js";
import type { ContainerBuilder, Guild } from "discord.js";

import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { formatProfileEmbed } from "./profile.js";
import type { ProfileLocale, VRChatUser } from "./profile.js";
import { resolvePanelChannel } from "./welcome-panel.js";
import type { PanelChannelIssue } from "./welcome-panel.js";
import type { UserRequestData } from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

// Fixed neutral-Spanish (LATAM) phrase table for profile rendering outside of a slash-command context,
// where no interaction locale is available. Mirrors the LATAM strings in `/viewprofile`.
const PROFILE_PHRASES: ProfileLocale = {
  "button.view_profile": "Ver perfil",
  "button.view_personality": "Ver personalidad",
  "embed.nostatus": "Sin estado",
  "embed.nopronouns": "No especificado",
  "embed.verification_by": "Verificado por <@{discord_id}>",
  "embed.banned": "¡Baneado!",
  "embed.banned_by": "Baneado por <@{banned_by}>\nRazón: **{banned_reason}**\nBaneado el {banned_at}",
  "embed.nobio": "Sin biografía.",
  "embed.header": "# [{profile_name}]({profile_url})",
  "embed.bio_title": "### 📖 Biografía",
  "embed.fields": "**Estado** ・ {profile_status}\n**Pronombres** ・ {profile_wokestuff}",
};

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Builds the Components V2 profile container for a verified Discord user, or `null` when the user has no
 * linked VRChat profile (not verified anywhere). Never throws: a missing profile or VRChat lookup failure
 * resolves to `null` so callers in event handlers can simply skip.
 */
export async function buildProfileContainer(
  requestData: UserRequestData,
  discordId: string,
): Promise<ContainerBuilder | null> {
  let profileData;
  try {
    profileData = await D1Class.getProfile(requestData, discordId);
  } catch {
    // The user is not verified in any server, so there is no profile to render.
    return null;
  }

  try {
    const vrchatResponse = await VRCHAT_CLIENT.getUser({ path: { userId: profileData.vrchat_id } });
    const vrchatData = vrchatResponse.data as unknown as VRChatUser;
    return formatProfileEmbed(vrchatData, profileData, PROFILE_PHRASES);
  } catch {
    return null;
  }
}

/** Why posting the profile did not happen, so the caller can report actionable channel/permission issues. */
export type ProfileSendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "no_profile" }
  | { sent: false; reason: "channel"; issue: PanelChannelIssue };

/**
 * Posts a Discord user's VRChat profile to the guild's configured profile-send channel. Resolves the
 * channel setting, builds the profile container and sends it, returning why it was skipped when it was
 * (setting unset, user not verified, or a channel/permission problem) so the caller can log it. Never
 * throws. Shared by the verification and sync flows so a member's profile is posted whenever they link or
 * re-sync here, regardless of which entry point they used.
 */
export async function sendProfileToChannel(
  guild: Guild,
  requestData: UserRequestData,
  discordId: string,
  settings: Record<string, string>,
): Promise<ProfileSendResult> {
  const channelId = settings[DISCORD_SERVER_SETTINGS.PROFILE_SEND_CHANNEL];
  if (!channelId || channelId === "0") {
    return { sent: false, reason: "not_configured" };
  }

  const container = await buildProfileContainer(requestData, discordId);
  if (!container) {
    return { sent: false, reason: "no_profile" };
  }

  const check = await resolvePanelChannel(guild, channelId);
  if (!check.ok) {
    return { sent: false, reason: "channel", issue: check.issue };
  }

  await check.channel
    .send({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
    })
    .catch(() => undefined);

  return { sent: true };
}
