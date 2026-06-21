// =========================================================================================================
// Cooldown Helper
// =========================================================================================================
// A small utility a command can call to rate-limit a user per command. This is not a framework layer:
// nothing intercepts interactions. A command that wants a cooldown calls checkCooldown() itself and
// decides what to do when the user is still within the window.

// =========================================================================================================
// Constants
// =========================================================================================================

const MS_PER_SECOND = 1000;

// =========================================================================================================
// Types
// =========================================================================================================

export interface CooldownState {
  /** True when the user is still within the cooldown window. */
  active: boolean;
  /** Whole seconds remaining until the cooldown expires (0 when not active). */
  remainingSeconds: number;
}

// =========================================================================================================
// State
// =========================================================================================================

// Keys are `${commandName}:${userId}` mapped to the epoch millisecond the cooldown expires.
const expiries = new Map<string, number>();

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Checks whether a user is on cooldown for a command. When the window has expired (or never existed),
 * starts a fresh cooldown of `seconds` and reports the user as clear to proceed.
 */
export function checkCooldown(commandName: string, userId: string, seconds: number): CooldownState {
  const key = `${commandName}:${userId}`;
  const now = Date.now();
  const expiresAt = expiries.get(key);

  if (expiresAt !== undefined && expiresAt > now) {
    return { active: true, remainingSeconds: Math.ceil((expiresAt - now) / MS_PER_SECOND) };
  }

  expiries.set(key, now + seconds * MS_PER_SECOND);
  return { active: false, remainingSeconds: 0 };
}
