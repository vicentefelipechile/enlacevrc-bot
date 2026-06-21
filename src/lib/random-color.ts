// =========================================================================================================
// Random Color
// =========================================================================================================
// Picks a random color from the discord.js Colors enum, used to vary embed accent colors.

import { Colors } from "discord.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const COLOR_VALUES = Object.values(Colors);

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Returns a random color value from the discord.js Colors enum.
 */
export function getRandomColor(): number {
  const index = Math.floor(Math.random() * COLOR_VALUES.length);
  // COLOR_VALUES is non-empty (the enum has many entries), so the index is always valid.
  return COLOR_VALUES[index]!;
}
