// =========================================================================================================
// Social Icons
// =========================================================================================================
// Maps social network domains to emojis and extracts/formats links found in free text (VRChat bios).

// =========================================================================================================
// Constants
// =========================================================================================================

/** Known social network hostnames mapped to a representative emoji. */
const SOCIAL_NETWORK_EMOJIS: Record<string, string> = {
  // Twitter / X
  "twitter.com": "🐦",
  "x.com": "🐦",

  // Facebook
  "facebook.com": "📘",
  "fb.com": "📘",

  // Instagram
  "instagram.com": "📷",

  // YouTube
  "youtube.com": "🎥",
  "youtu.be": "🎥",

  // Twitch
  "twitch.tv": "🎮",

  // Discord
  "discord.gg": "💬",
  "discord.com": "💬",

  // TikTok
  "tiktok.com": "🎵",

  // LinkedIn
  "linkedin.com": "💼",

  // GitHub
  "github.com": "💻",

  // Reddit
  "reddit.com": "🔴",

  // Telegram
  "t.me": "✈️",
  "telegram.org": "✈️",

  // VRChat
  "vrchat.com": "🎮",

  // Patreon
  "patreon.com": "💰",

  // Ko-fi
  "ko-fi.com": "☕",
};

const UNKNOWN_LINK_EMOJI = "🔗";
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// =========================================================================================================
// Types
// =========================================================================================================

export interface FormattedUrls {
  formatted_urls: string[];
  has_unknown_links: boolean;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Returns the emoji for a URL's hostname, or null when it is not a known social network. */
export function getEmojiForUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return SOCIAL_NETWORK_EMOJIS[hostname] ?? null;
  } catch {
    return null;
  }
}

/** Extracts all http(s) URLs from a block of text. */
export function extractUrls(text: string): string[] {
  if (!text) {
    return [];
  }
  return text.match(URL_REGEX) ?? [];
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Formats every URL in the text with a leading emoji: a network-specific one when recognized, or a
 * generic link emoji otherwise. Reports whether any unknown (non-social) links were present.
 */
export function formatUrlsWithEmojis(text: string): FormattedUrls {
  const urls = extractUrls(text);
  const formattedUrls: string[] = [];
  let hasUnknownLinks = false;

  for (const url of urls) {
    const emoji = getEmojiForUrl(url);
    if (emoji) {
      formattedUrls.push(`${emoji} ${url}`);
    } else {
      formattedUrls.push(`${UNKNOWN_LINK_EMOJI} ${url}`);
      hasUnknownLinks = true;
    }
  }

  return { formatted_urls: formattedUrls, has_unknown_links: hasUnknownLinks };
}
