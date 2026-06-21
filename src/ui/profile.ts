// =========================================================================================================
// Profile Embed
// =========================================================================================================
// Builds the Components V2 container that renders a user's VRChat profile: name, bio (with 16Personalities
// links), avatar, verification/ban footer and action buttons (profile link + personality link).

// =========================================================================================================
// Imports
// =========================================================================================================

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";

import { getRandomColor } from "../lib/random-color.js";
import type { Profile } from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const PERSONALITY_URL = "https://www.16personalities.com/es/personalidad-";

const PERSONALITY_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const VRCHAT_PROFILE_BASE = "https://vrchat.com/home/user/";

// =========================================================================================================
// Types
// =========================================================================================================

/** Phrase table passed by the calling command (flat key -> localized string). */
export type ProfileLocale = Record<string, string>;

/** Subset of the VRChat user object this embed reads. */
export interface VRChatUser {
  id: string;
  displayName: string;
  bio: string;
  status?: string;
  pronouns?: string;
  date_joined?: string;
  profilePicOverride?: string;
  currentAvatarImageUrl?: string;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Formats a date as DD/MM/YYYY HH:MM in Spanish locale. */
function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Replaces any 16Personalities type code in the text with a markdown link to its page. */
export function formatP16(description: string): string {
  let formatted = description;
  for (const type of PERSONALITY_TYPES) {
    const regex = new RegExp(`\\b(${type}(?:-[A-Z])?)\\b`, "gi");
    if (regex.test(description)) {
      formatted = formatted.replace(regex, `[$1](${PERSONALITY_URL}${type.toLowerCase()})`);
    }
  }
  return formatted;
}

/** Returns the 16Personalities page URL for the first type code found, or null. */
export function extractP16Url(description: string): string | null {
  for (const type of PERSONALITY_TYPES) {
    const regex = new RegExp(`\\b(${type}(?:-[A-Z])?)\\b`, "i");
    if (regex.test(description)) {
      return `${PERSONALITY_URL}${type.toLowerCase()}`;
    }
  }
  return null;
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Builds the Components V2 container for a VRChat profile. `profileData` carries the EnlaceVRC record
 * (verification/ban state) and `locale` the command's localized phrase table.
 */
export function formatProfileEmbed(
  vrchatUser: VRChatUser,
  profileData: Profile,
  locale: ProfileLocale,
): ContainerBuilder {
  const sanitizedBio = vrchatUser.bio.replace(/([`*_~|\\-])/g, "\\$1");
  const formattedBio = formatP16(sanitizedBio);

  let displayName = vrchatUser.displayName;
  if (profileData.is_banned) {
    displayName = `~~${displayName}~~ ${locale["embed.banned"] ?? ""}`;
  }

  const profileUrl = `${VRCHAT_PROFILE_BASE}${vrchatUser.id}`;

  const textContent = (locale["embed.body"] ?? "")
    .replace("{profile_name}", displayName)
    .replace("{profile_url}", profileUrl)
    .replace("{profile_bio}", formattedBio)
    .replace("{profile_status}", vrchatUser.status ?? locale["embed.nostatus"] ?? "")
    .replace("{profile_wokestuff}", vrchatUser.pronouns ?? locale["embed.nopronouns"] ?? "");

  let footerContent = "";
  if (profileData.is_verified) {
    footerContent +=
      (locale["embed.verification_by"] ?? "").replace(
        "{discord_id}",
        profileData.verified_by ?? "",
      ) + "\n";
  }
  footerContent += `ID: ${vrchatUser.id} • ${formatDate(vrchatUser.date_joined ?? Date.now())}`;

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(locale["button.view_profile"] ?? "View Profile")
      .setStyle(ButtonStyle.Link)
      .setEmoji("🔗")
      .setURL(profileUrl),
  );

  const personalityUrl = extractP16Url(vrchatUser.bio);
  if (personalityUrl) {
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel(locale["button.view_personality"] ?? "View Personality")
        .setStyle(ButtonStyle.Link)
        .setEmoji("🧠")
        .setURL(personalityUrl),
    );
  }

  const container = new ContainerBuilder()
    .setAccentColor(getRandomColor())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(textContent))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems({
        media: { url: vrchatUser.profilePicOverride ?? vrchatUser.currentAvatarImageUrl ?? "" },
      }),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerContent));

  if (profileData.is_banned) {
    const bannedFooter = (locale["embed.banned_by"] ?? "")
      .replace("{banned_by}", profileData.banned_by ?? "")
      .replace("{banned_reason}", profileData.banned_reason ?? "")
      .replace("{banned_at}", formatDate(profileData.banned_at ?? Date.now()));

    container
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(bannedFooter))
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      );
  }

  container.addActionRowComponents(buttons);
  return container;
}
