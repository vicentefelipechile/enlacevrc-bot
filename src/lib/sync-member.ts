// =========================================================================================================
// Sync Member
// =========================================================================================================
// The reusable core of the synchronization flow: given a guild member with a verified VRChat profile, it
// re-applies the verification role, optional 18+ role and auto-nickname, respecting the bot's permissions
// and the role hierarchy. Shared by the `/sync` command and the welcome panel's Sync button so both behave
// identically. The caller supplies its own localized phrase table and renders the returned outcome.

// =========================================================================================================
// Imports
// =========================================================================================================

import { PermissionsBitField } from "discord.js";
import type { Guild, GuildMember, Role } from "discord.js";

import { DISCORD_SERVER_SETTINGS } from "../constants/discord-settings.js";
import { D1Class } from "../services/d1.js";
import { sendProfileToChannel } from "../ui/profile-message.js";
import type { UserRequestData } from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const AUTO_NICKNAME_ENABLED = "1";

// =========================================================================================================
// Types
// =========================================================================================================

/**
 * The localized strings the sync core needs. Callers pass their own table (a superset is fine); the keys
 * here are exactly the ones the shared logic reads, so both call sites can reuse their existing phrases.
 */
export interface SyncPhrases {
  "error.no_profile": string;
  "error.banned": string;
  "error.bot_no_perm": string;
  "solution.bot_no_perm": string;
  "error.role_hierarchy": string;
  "solution.role_hierarchy": string;
  "log.role_fail": string;
  "log.plus_role_fail": string;
}

/** A recoverable failure the caller renders as a localized error (title + optional solution/detail). */
export interface SyncError {
  title: string;
  description: string;
}

/** The roles/nickname the sync actually changed, so the caller can report exactly what happened. */
export interface SyncChanges {
  rolesAdded: string[];
  nicknameUpdated: boolean;
  nickname: string | null;
}

/** Outcome of a sync attempt: either an error to show, or the set of applied changes. */
export type SyncResult = { ok: false; error: SyncError } | { ok: true; changes: SyncChanges };

// =========================================================================================================
// Helpers
// =========================================================================================================

/**
 * Attempts to grant a role to the member, respecting role hierarchy. Records the role in `changes` on
 * success; returns a `SyncError` on a hierarchy or API failure, or null when nothing was needed.
 */
async function grantRole(
  member: GuildMember,
  botMember: GuildMember,
  role: Role,
  changes: SyncChanges,
  phrases: SyncPhrases,
  failKey: "log.role_fail" | "log.plus_role_fail",
): Promise<SyncError | null> {
  if (member.roles.cache.has(role.id)) {
    return null;
  }

  if (botMember.roles.highest.position <= role.position) {
    return {
      title: phrases["error.role_hierarchy"].replace("{role}", role.name),
      description: phrases["solution.role_hierarchy"].replace("{role}", role.name),
    };
  }

  try {
    await member.roles.add(role);
    changes.rolesAdded.push(role.toString());
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      title: phrases[failKey].replace("{role}", role.name).replace("{error}", message),
      description: String(error),
    };
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Synchronizes a member's roles and nickname with their verified VRChat profile. Returns a `SyncResult`:
 * an error (no profile, banned, missing permission, role hierarchy, or an API failure) or the applied
 * changes. Does not touch Discord replies — the caller renders the outcome in its own context.
 */
export async function syncMember(
  guild: Guild,
  member: GuildMember,
  requestData: UserRequestData,
  phrases: SyncPhrases,
): Promise<SyncResult> {
  let profileData;
  try {
    profileData = await D1Class.getProfile(requestData, member.id, true);
  } catch {
    profileData = null;
  }

  if (!profileData) {
    return { ok: false, error: { title: phrases["error.no_profile"], description: "" } };
  }

  if (profileData.is_banned) {
    return { ok: false, error: { title: phrases["error.banned"], description: "" } };
  }

  const settings = await D1Class.getAllDiscordSettings(requestData, guild.id);
  const botMember = await guild.members.fetchMe();

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return {
      ok: false,
      error: { title: phrases["error.bot_no_perm"], description: phrases["solution.bot_no_perm"] },
    };
  }

  const changes: SyncChanges = { rolesAdded: [], nicknameUpdated: false, nickname: null };

  // 1. Basic verification role.
  const verificationRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE];
  if (verificationRoleId) {
    const role = guild.roles.cache.get(verificationRoleId);
    if (role) {
      const failure = await grantRole(member, botMember, role, changes, phrases, "log.role_fail");
      if (failure) {
        return { ok: false, error: failure };
      }
    }
  }

  // 2. Auto nickname. Renaming a member requires the "Manage Nicknames" permission *and* a higher role;
  // when either is missing Discord rejects `setNickname` with 50013, so we guard both and skip the nickname
  // rather than failing the whole sync — the roles above are what matter, the nickname is a nice-to-have.
  if (settings[DISCORD_SERVER_SETTINGS.AUTO_NICKNAME] === AUTO_NICKNAME_ENABLED) {
    const newNickname = profileData.vrchat_name;
    const canManageNicknames = botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames);
    const outranksMember = botMember.roles.highest.position > member.roles.highest.position;
    if (
      canManageNicknames &&
      outranksMember &&
      member.nickname !== newNickname &&
      member.user.username !== newNickname
    ) {
      // A nickname failure (e.g. Discord still rejecting with 50013 for a specific member) must never
      // abort the sync — the roles above are what matter, so we swallow it and simply leave the nickname.
      await member
        .setNickname(newNickname)
        .then(() => {
          changes.nicknameUpdated = true;
          changes.nickname = newNickname;
        })
        .catch(() => undefined);
    }
  }

  // 3. Plus (18+) verification role.
  if (profileData.is_verified) {
    const plusRoleId = settings[DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE];
    if (plusRoleId) {
      const role = guild.roles.cache.get(plusRoleId);
      if (role) {
        const failure = await grantRole(
          member,
          botMember,
          role,
          changes,
          phrases,
          "log.plus_role_fail",
        );
        if (failure) {
          return { ok: false, error: failure };
        }
      }
    }
  }

  // The member's linked profile is now (re-)synced here, so post it to the profile-send channel if one is
  // configured. Failures are swallowed inside the helper; the sync result stands regardless.
  await sendProfileToChannel(guild, requestData, member.id, settings);

  return { ok: true, changes };
}
