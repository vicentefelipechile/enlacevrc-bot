// =========================================================================================================
// D1 Service
// =========================================================================================================
// Client for the EnlaceVRC database worker. Wraps authenticated HTTP calls with a node-cache layer so
// repeated reads (profiles, staff, settings, groups) don't hammer the worker. Mutations invalidate the
// relevant cache keys. Kept as a static class to preserve the original call sites (D1Class.method()).

import NodeCache from "node-cache";

import type {
  AddGroupResponse,
  AddServerResponse,
  CreateProfileInput,
  CreateStaffInput,
  DiscordServer,
  DiscordSetting,
  ListProfilesFilters,
  LogGroupResponse,
  MutationResponse,
  Profile,
  Staff,
  UserRequestData,
  VerifyProfileInput,
  VRChatGroup,
} from "../types/models.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const DEFAULT_BASE_ENDPOINT = "https://enlacevrc-db.vicentefelipechile.workers.dev/";

// Per-data-type cache lifetimes (milliseconds). node-cache TTLs are in seconds, so we divide on set.
const TTLS = {
  profile: MINUTE * 5,
  staff: MINUTE * 30,
  discordConfig: HOUR * 2,
  group: HOUR,
} as const;

// =========================================================================================================
// Types
// =========================================================================================================

interface InitOptions {
  apiKey: string;
  baseEndPoint?: string;
  force?: boolean;
}

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

/** Standard worker envelope: payload lives under `data`. */
interface DataEnvelope<T> {
  data: T;
  error?: string;
}

/** Error thrown by D1 requests, preserving the HTTP status so callers can branch on it (e.g. 409). */
export class D1RequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "D1RequestError";
    this.status = status;
  }
}

// =========================================================================================================
// Main
// =========================================================================================================

export class D1Class {
  private static baseEndPoint = DEFAULT_BASE_ENDPOINT;
  private static apiKey: string | null = null;

  private static cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

  /**
   * Initializes the client with an API key. Throws if already initialized unless `force` is set.
   */
  static init({ apiKey, baseEndPoint, force = false }: InitOptions): void {
    if (D1Class.apiKey && !force) {
      throw new Error("D1Class is already initialized. Pass force to reinitialize.");
    }

    D1Class.cache.flushAll();
    D1Class.apiKey = apiKey;

    if (baseEndPoint) {
      D1Class.baseEndPoint = baseEndPoint;
    }
  }

  // =======================================================================================================
  // Helper Methods
  // =======================================================================================================

  /**
   * Performs an authenticated HTTP request and returns the parsed JSON body typed as T.
   * Throws on non-2xx responses, preferring the worker's `error` field as the message.
   */
  private static async _request<T>(
    endpoint: string,
    userRequestData: UserRequestData,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!D1Class.apiKey) {
      throw new Error("D1Class is not initialized. Call D1Class.init() first.");
    }

    if (!userRequestData?.discord_id || !userRequestData?.discord_name) {
      throw new Error("user_request_data must contain discord_id and discord_name");
    }

    const url = `${D1Class.baseEndPoint}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${D1Class.apiKey}`,
      "X-Discord-ID": userRequestData.discord_id,
      "X-Discord-Name": userRequestData.discord_name,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // The worker normally answers JSON, but a 500 may return a plain-text body (e.g. a Cloudflare
    // error page). Read as text first so a non-JSON error body doesn't mask the real failure.
    const rawBody = await response.text();
    let data: (T & { error?: string }) | null = null;
    try {
      data = rawBody ? (JSON.parse(rawBody) as T & { error?: string }) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.error ?? rawBody.trim();
      throw new D1RequestError(
        response.status,
        detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return data as T;
  }

  /**
   * Returns a cached value or computes, caches and returns it. TTL is given in milliseconds and
   * converted to the seconds node-cache expects.
   */
  private static async _getCached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number,
  ): Promise<T> {
    const cached = D1Class.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    D1Class.cache.set(key, value, ttlMs / 1000);
    return value;
  }

  /** Deletes every cache key containing the given substring. */
  private static _invalidateCache(pattern: string): void {
    for (const key of D1Class.cache.keys()) {
      if (key.includes(pattern)) {
        D1Class.cache.del(key);
      }
    }
  }

  // =======================================================================================================
  // Profile Methods
  // =======================================================================================================

  static async createProfile(
    userRequestData: UserRequestData,
    profileData: CreateProfileInput,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>("/profile/new", userRequestData, {
      method: "POST",
      body: JSON.stringify(profileData),
    });

    D1Class._invalidateCache("profile:");
    return response;
  }

  static async getProfile(
    userRequestData: UserRequestData,
    profileId: string,
    useCache = true,
  ): Promise<Profile> {
    const cacheKey = `profile:${profileId}`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<Profile>>(
          `/profile/${profileId}/get`,
          userRequestData,
        );
        return response.data;
      },
      TTLS.profile,
    );
  }

  static async listProfiles(
    userRequestData: UserRequestData,
    filters: ListProfilesFilters = {},
  ): Promise<Profile[]> {
    const params = new URLSearchParams(
      Object.entries(filters).map(([key, value]): [string, string] => [key, String(value)]),
    );
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await D1Class._request<DataEnvelope<Profile[]>>(
      `/profile/list${queryString}`,
      userRequestData,
    );
    return response.data;
  }

  static async deleteProfile(
    userRequestData: UserRequestData,
    profileId: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/profile/${profileId}/delete`,
      userRequestData,
      { method: "DELETE" },
    );

    D1Class._invalidateCache("profile:");
    return response;
  }

  static async banProfile(
    userRequestData: UserRequestData,
    profileId: string,
    bannedReason: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/profile/${profileId}/ban`,
      userRequestData,
      { method: "PUT", body: JSON.stringify({ banned_reason: bannedReason }) },
    );

    D1Class.cache.del(`profile:${profileId}`);
    return response;
  }

  static async unbanProfile(
    userRequestData: UserRequestData,
    profileId: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/profile/${profileId}/unban`,
      userRequestData,
      { method: "PUT" },
    );

    D1Class.cache.del(`profile:${profileId}`);
    return response;
  }

  static async verifyProfile(
    userRequestData: UserRequestData,
    profileId: string,
    verificationData: VerifyProfileInput,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/profile/${profileId}/verify`,
      userRequestData,
      { method: "PUT", body: JSON.stringify(verificationData) },
    );

    D1Class.cache.del(`profile:${profileId}`);
    return response;
  }

  static async unverifyProfile(
    userRequestData: UserRequestData,
    profileId: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/profile/${profileId}/unverify`,
      userRequestData,
      { method: "PUT" },
    );

    D1Class.cache.del(`profile:${profileId}`);
    return response;
  }

  // =======================================================================================================
  // Staff Methods
  // =======================================================================================================

  static async createStaff(
    userRequestData: UserRequestData,
    staffData: CreateStaffInput,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>("/staff/new", userRequestData, {
      method: "POST",
      body: JSON.stringify(staffData),
    });

    D1Class._invalidateCache("staff:");
    return response;
  }

  static async getStaff(
    userRequestData: UserRequestData,
    staffId: string,
    useCache = true,
  ): Promise<Staff> {
    const cacheKey = `staff:${staffId}`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        // Bug fix: unified to response.data to match every other endpoint's envelope.
        const response = await D1Class._request<DataEnvelope<Staff>>(
          `/staff/${staffId}/get`,
          userRequestData,
        );
        return response.data;
      },
      TTLS.staff,
    );
  }

  static async listStaff(userRequestData: UserRequestData, useCache = true): Promise<Staff[]> {
    const cacheKey = "staff:list";

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<Staff[]>>(
          "/staff/list",
          userRequestData,
        );
        return response.data;
      },
      TTLS.staff,
    );
  }

  static async updateStaffName(
    userRequestData: UserRequestData,
    staffId: string,
    newName: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/staff/${staffId}/update`,
      userRequestData,
      { method: "PUT", body: JSON.stringify({ discord_name: newName }) },
    );

    D1Class.cache.del(`staff:${staffId}`);
    D1Class.cache.del("staff:list");
    return response;
  }

  static async deleteStaff(
    userRequestData: UserRequestData,
    staffId: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/staff/${staffId}/delete`,
      userRequestData,
      { method: "DELETE" },
    );

    D1Class._invalidateCache("staff:");
    return response;
  }

  // =======================================================================================================
  // Discord Settings Methods
  // =======================================================================================================

  static async addDiscordServer(
    userRequestData: UserRequestData,
    discordServerId: string,
    serverName: string,
  ): Promise<AddServerResponse> {
    const response = await D1Class._request<AddServerResponse>(
      "/discord/add-server",
      userRequestData,
      {
        method: "POST",
        body: JSON.stringify({ discord_server_id: discordServerId, server_name: serverName }),
      },
    );

    D1Class._invalidateCache(`discord:${discordServerId}`);
    return response;
  }

  static async getDiscordSetting(
    userRequestData: UserRequestData,
    serverId: string,
    settingKey: string,
    useCache = true,
  ): Promise<string> {
    const cacheKey = `discord:${serverId}:${settingKey}`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<Record<string, string>>>(
          `/discord/${serverId}/get-setting?setting_key=${settingKey}`,
          userRequestData,
        );
        return response.data[settingKey] ?? "";
      },
      TTLS.discordConfig,
    );
  }

  static async getAllDiscordSettings(
    userRequestData: UserRequestData,
    serverId: string,
    useCache = true,
  ): Promise<Record<string, string>> {
    const cacheKey = `discord:${serverId}:all`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<Record<string, string>>>(
          `/discord/${serverId}/get-setting?getallsettings=true`,
          userRequestData,
        );
        return response.data;
      },
      TTLS.discordConfig,
    );
  }

  static async listDiscordSettings(
    userRequestData: UserRequestData,
    serverId: string,
  ): Promise<DiscordSetting[]> {
    const response = await D1Class._request<DataEnvelope<DiscordSetting[]>>(
      `/discord/${serverId}/list-settings`,
      userRequestData,
    );
    return response.data;
  }

  static async updateDiscordSetting(
    userRequestData: UserRequestData,
    serverId: string,
    settingKey: string,
    settingValue: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/discord/${serverId}/update-setting`,
      userRequestData,
      {
        method: "PUT",
        body: JSON.stringify({ setting_key: settingKey, setting_value: settingValue }),
      },
    );

    D1Class._invalidateCache(`discord:${serverId}`);
    return response;
  }

  static async newDiscordSetting(
    userRequestData: UserRequestData,
    settingKey: string,
    settingType: string,
    defaultValue: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      "/discord/new-setting",
      userRequestData,
      {
        method: "POST",
        body: JSON.stringify({
          setting_key: settingKey,
          setting_type: settingType,
          default_value: defaultValue,
        }),
      },
    );

    // Bug fix: this endpoint creates a setting globally and has no server scope, so the previous
    // `discord:${serverId}` invalidation referenced an undefined variable. Flush all discord caches.
    D1Class._invalidateCache("discord:");
    return response;
  }

  static async discordServerExists(
    userRequestData: UserRequestData,
    serverId: string,
  ): Promise<boolean> {
    const response = await D1Class._request<DataEnvelope<{ exists: boolean }>>(
      `/discord/${serverId}/exists-server`,
      userRequestData,
    );
    return response.data.exists;
  }

  static async listDiscordServers(userRequestData: UserRequestData): Promise<DiscordServer[]> {
    const response = await D1Class._request<DataEnvelope<DiscordServer[]>>(
      "/discord/list-servers",
      userRequestData,
    );
    return response.data;
  }

  // =======================================================================================================
  // VRChat Group Methods
  // =======================================================================================================

  static async addVRChatGroup(
    userRequestData: UserRequestData,
    vrchatGroupId: string,
    discordServerId: string,
    groupName: string,
  ): Promise<AddGroupResponse> {
    const response = await D1Class._request<AddGroupResponse>("/group/add-group", userRequestData, {
      method: "POST",
      body: JSON.stringify({
        vrchat_group_id: vrchatGroupId,
        discord_server_id: discordServerId,
        group_name: groupName,
      }),
    });

    D1Class._invalidateCache(`group:${vrchatGroupId}`);
    D1Class._invalidateCache(`discord:${discordServerId}:groups`);
    return response;
  }

  static async listVRChatGroups(
    userRequestData: UserRequestData,
    serverId: string,
    useCache = true,
  ): Promise<VRChatGroup[]> {
    const cacheKey = `discord:${serverId}:groups`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<{ groups: VRChatGroup[] }>>(
          `/discord/${serverId}/list-groups`,
          userRequestData,
        );
        return response.data.groups;
      },
      TTLS.group,
    );
  }

  static async getVRChatGroup(
    userRequestData: UserRequestData,
    groupId: string,
    useCache = true,
  ): Promise<VRChatGroup> {
    const cacheKey = `group:${groupId}`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<VRChatGroup>>(
          `/group/${groupId}/get-group`,
          userRequestData,
        );
        return response.data;
      },
      TTLS.group,
    );
  }

  static async getVRChatGroupServer(
    userRequestData: UserRequestData,
    groupId: string,
    useCache = true,
  ): Promise<DiscordServer> {
    const cacheKey = `group:${groupId}:server`;

    if (!useCache) {
      D1Class.cache.del(cacheKey);
    }

    return D1Class._getCached(
      cacheKey,
      async () => {
        const response = await D1Class._request<DataEnvelope<DiscordServer>>(
          `/group/${groupId}/get-server`,
          userRequestData,
        );
        return response.data;
      },
      TTLS.group,
    );
  }

  static async updateVRChatGroup(
    userRequestData: UserRequestData,
    groupId: string,
    newName: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/group/${groupId}/update-group`,
      userRequestData,
      { method: "PUT", body: JSON.stringify({ group_name: newName }) },
    );

    D1Class.cache.del(`group:${groupId}`);
    D1Class.cache.del(`group:${groupId}:server`);
    return response;
  }

  static async deleteVRChatGroup(
    userRequestData: UserRequestData,
    groupId: string,
  ): Promise<MutationResponse> {
    const response = await D1Class._request<MutationResponse>(
      `/group/${groupId}/delete-group`,
      userRequestData,
      { method: "DELETE" },
    );

    D1Class._invalidateCache(`group:${groupId}`);
    return response;
  }

  static async logVRChatGroup(
    userRequestData: UserRequestData,
    vrchatGroupId: string,
    discordServerId: string,
    actionDescription: string,
  ): Promise<LogGroupResponse> {
    return D1Class._request<LogGroupResponse>("/group/log-group", userRequestData, {
      method: "POST",
      body: JSON.stringify({
        vrchat_group_id: vrchatGroupId,
        discord_server_id: discordServerId,
        action_description: actionDescription,
      }),
    });
  }

  // =======================================================================================================
  // Utility Methods
  // =======================================================================================================

  static clearCache(): void {
    D1Class.cache.flushAll();
  }

  static clearProfileCache(): void {
    D1Class._invalidateCache("profile:");
  }

  static clearStaffCache(): void {
    D1Class._invalidateCache("staff:");
  }

  static clearDiscordCache(): void {
    D1Class._invalidateCache("discord:");
  }

  static clearGroupCache(): void {
    D1Class._invalidateCache("group:");
  }

  static getCacheStats(): NodeCache.Stats {
    return D1Class.cache.getStats();
  }
}
