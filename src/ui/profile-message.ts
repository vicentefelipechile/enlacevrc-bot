// =========================================================================================================
// Profile Message
// =========================================================================================================
// Fetches a Discord user's linked VRChat profile and builds the shared Components V2 container for it.
// Used by non-interaction contexts (e.g. the member-join event) that need the same profile rendering as
// `/viewprofile` but without a slash-command locale. The phrase table here is fixed to neutral Spanish
// (LATAM), matching the project's default audience.

// =========================================================================================================
// Imports
// =========================================================================================================

import type { ContainerBuilder } from "discord.js";

import { D1Class } from "../services/d1.js";
import { VRCHAT_CLIENT } from "../services/vrchat.js";
import { formatProfileEmbed } from "./profile.js";
import type { ProfileLocale, VRChatUser } from "./profile.js";
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
  "embed.body":
    "# [{profile_name}]({profile_url})\n\n## Biografía\n\n{profile_bio}\n\n**Estado**: {profile_status}\n**Pronombres**: {profile_wokestuff}",
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
