// =========================================================================================================
// VRChat Code Utilities
// =========================================================================================================
// Helpers to derive a short verification code from a VRChat user ID and to extract/validate a VRChat
// user ID from either a raw ID or a profile URL.

// =========================================================================================================
// Constants
// =========================================================================================================

// Matches a full VRChat profile URL and captures the user ID (usr_<uuid>).
const REGEX_URL =
  /^(?:https?:\/\/)?(?:www\.)?vrchat\.com\/home\/user\/(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/;

// Matches a bare VRChat user ID.
const REGEX_ID = /^(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/;

// A valid VRChat ID has the form usr_<8>-<4>-<4>-<4>-<12>: five dash-separated groups after "usr_".
const EXPECTED_ID_PARTS = 5;

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Derives a 6-character uppercase verification code from a VRChat user ID, combining the first three
 * characters of the first ID segment with the last three of the final segment.
 */
export function generateCodeByVRChat(vrchatId: string): string {
  const idParts = vrchatId.substring(4).split("-");
  if (idParts.length !== EXPECTED_ID_PARTS) {
    throw new Error("Invalid VRChat ID format");
  }

  const firstPart = idParts[0]!;
  const lastPart = idParts[idParts.length - 1]!;
  return `${firstPart.substring(0, 3)}${lastPart.substring(lastPart.length - 3)}`.toUpperCase();
}

/**
 * Extracts a VRChat user ID from a profile URL or validates a bare ID.
 * Returns the ID on success, or null when the input is neither a valid URL nor a valid ID.
 */
export function getVRChatId(vrchatId: string): string | null {
  const match = vrchatId.match(REGEX_URL);
  if (match?.[1]) {
    return match[1];
  }

  if (REGEX_ID.test(vrchatId)) {
    return vrchatId;
  }

  return null;
}
