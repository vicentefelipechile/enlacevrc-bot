// =========================================================================================================
// Instance Parser
// =========================================================================================================
// Parses VRChat instance URLs / instance IDs into their components (world, instance type, region, owner)
// and validates world IDs.

// =========================================================================================================
// Imports
// =========================================================================================================

import { printMessage } from "../lib/logger.js";

// =========================================================================================================
// Constants
// =========================================================================================================

/** Human-readable names for each instance type key. */
const INSTANCE_TYPES: Record<string, string> = {
  public: "Public",
  "friends+": "Friends+",
  friends: "Friends",
  "invite+": "Invite+",
  invite: "Invite Only",
  group: "Group",
  groupPlus: "Group+",
  groupPublic: "Group Public",
};

/** Human-readable names for each region key. */
const REGIONS: Record<string, string> = {
  us: "US West",
  use: "US East",
  eu: "Europe",
  jp: "Japan",
};

const WORLD_ID_REGEX =
  /^wrld_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const VRCHAT_URL_REGEX = /vrchat\.com\/home\/(launch|world)/i;
const WORLD_PATH_REGEX = /world\/(wrld_[a-f0-9-]+)/;
const INSTANCE_TYPE_REGEX =
  /^(public|friends\+?|invite\+?|group|groupPlus|groupPublic)(?:\((usr_[a-f0-9-]+)\))?$/;
const REGION_REGEX = /^region\((\w+)\)$/;
const NONCE_REGEX = /^nonce\(([a-f0-9-]+)\)$/;

const DEFAULT_INSTANCE_TYPE = "public";
const DEFAULT_REGION = "us";

// =========================================================================================================
// Types
// =========================================================================================================

export interface ParsedInstance {
  world_id: string | null;
  instance_id: string | null;
  instance_number: string | null;
  instance_type: string;
  instance_type_key: string;
  region: string;
  region_key: string;
  owner_id: string | null;
  nonce: string | null;
  full_instance: string | null;
}

interface InstanceIdParts {
  instanceNumber: string | null;
  instanceType: string;
  region: string;
  ownerId: string | null;
  nonce: string | null;
}

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Extracts the world and instance IDs from a VRChat URL or a raw instance string. */
function extractWorldAndInstance(input: string): { worldId: string | null; instanceId: string | null } {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const url = new URL(input);
    let worldId = url.searchParams.get("worldId");
    const instanceId = url.searchParams.get("instanceId");

    if (!worldId) {
      const pathMatch = url.pathname.match(WORLD_PATH_REGEX);
      if (pathMatch) {
        worldId = pathMatch[1] ?? null;
      }
    }

    return { worldId, instanceId };
  }

  // Raw string: either a world ID (optionally with ":instance") or a bare instance string.
  if (input.startsWith("wrld_")) {
    const [worldId, instanceId] = input.split(":");
    return { worldId: worldId ?? null, instanceId: instanceId ?? null };
  }

  return { worldId: null, instanceId: input };
}

/** Parses a raw instance ID (e.g. "12345~private(usr_x)~region(us)~nonce(x)") into its parts. */
function parseInstanceId(instanceId: string): InstanceIdParts {
  const parts = instanceId.split("~");
  const result: InstanceIdParts = {
    instanceNumber: parts[0] ?? null,
    instanceType: DEFAULT_INSTANCE_TYPE,
    region: DEFAULT_REGION,
    ownerId: null,
    nonce: null,
  };

  for (const part of parts) {
    const typeMatch = part.match(INSTANCE_TYPE_REGEX);
    if (typeMatch) {
      result.instanceType = typeMatch[1] ?? DEFAULT_INSTANCE_TYPE;
      result.ownerId = typeMatch[2] ?? null;
    }

    const regionMatch = part.match(REGION_REGEX);
    if (regionMatch) {
      result.region = regionMatch[1] ?? DEFAULT_REGION;
    }

    const nonceMatch = part.match(NONCE_REGEX);
    if (nonceMatch) {
      result.nonce = nonceMatch[1] ?? null;
    }
  }

  return result;
}

// =========================================================================================================
// Main
// =========================================================================================================

/** Parses a VRChat instance URL or instance ID into structured data, or null when invalid. */
export function parseVRChatInstance(input: string): ParsedInstance | null {
  try {
    const { worldId, instanceId } = extractWorldAndInstance(input);

    if (!instanceId && !worldId) {
      return null;
    }

    const parts = instanceId
      ? parseInstanceId(instanceId)
      : {
          instanceNumber: null,
          instanceType: DEFAULT_INSTANCE_TYPE,
          region: DEFAULT_REGION,
          ownerId: null,
          nonce: null,
        };

    return {
      world_id: worldId,
      instance_id: instanceId,
      instance_number: parts.instanceNumber,
      instance_type: INSTANCE_TYPES[parts.instanceType] ?? parts.instanceType,
      instance_type_key: parts.instanceType,
      region: REGIONS[parts.region] ?? parts.region.toUpperCase(),
      region_key: parts.region,
      owner_id: parts.ownerId,
      nonce: parts.nonce,
      full_instance: worldId && instanceId ? `${worldId}:${instanceId}` : null,
    };
  } catch (error) {
    printMessage("Error parsing VRChat instance:", String(error));
    return null;
  }
}

/** Returns true when the string is a syntactically valid VRChat world ID. */
export function isValidWorldId(worldId: string): boolean {
  return WORLD_ID_REGEX.test(worldId);
}

/** Returns true when the text contains a VRChat launch/world URL. */
export function containsVRChatUrl(text: string): boolean {
  return VRCHAT_URL_REGEX.test(text);
}
