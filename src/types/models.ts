// =========================================================================================================
// Database Models
// =========================================================================================================
// TypeScript counterparts of the EnlaceVRC database entities. These mirror the JSDoc typedefs that
// previously lived in d1class.js and describe the shapes returned by the D1 worker API.

// =========================================================================================================
// Request Context
// =========================================================================================================

/** Identifies the Discord user performing a D1 request (sent as auth headers). */
export interface UserRequestData {
  discord_id: string;
  discord_name: string;
}

// =========================================================================================================
// Core Entities
// =========================================================================================================

export interface SettingType {
  setting_type_id: number;
  type_name: string;
  description?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface VerificationType {
  verification_type_id: number;
  type_name: string;
  description?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  is_disabled: boolean;
}

export interface Setting {
  setting_id: number;
  setting_name: string;
  setting_type_id: number;
  default_value: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  is_disabled: boolean;
}

export interface LogLevel {
  log_level_id: number;
  level_name: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface Log {
  log_id: number;
  log_level_id: number;
  log_message: string;
  created_at: string;
  created_by: string;
}

export interface DiscordServer {
  discord_server_id: string;
  server_name: string;
  added_at: string;
  added_by: string;
}

export interface BotAdmin {
  discord_id: string;
  added_at: string;
  added_by: string;
}

export interface Staff {
  discord_id: string;
  discord_name?: string;
  added_at: string;
  added_by: string;
}

export interface Profile {
  discord_id: string;
  vrchat_id: string;
  vrchat_name: string;
  added_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  is_banned: boolean | number;
  banned_at?: string;
  banned_reason?: string;
  banned_by?: string;
  is_verified: boolean | number;
  verification_id: number;
  verified_at?: string;
  verified_from?: string;
  verified_by?: string;
}

export interface DiscordSetting {
  discord_setting_id: number;
  discord_server_id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface VRChatGroup {
  vrchat_group_id: string;
  discord_server_id: string;
  group_name: string;
  added_at: string;
  added_by: string;
}

// =========================================================================================================
// API Payloads
// =========================================================================================================

/** Generic success/message envelope returned by mutating endpoints. */
export interface MutationResponse {
  success: boolean;
  message: string;
}

export interface AddServerResponse extends MutationResponse {
  settings_added: number;
}

export interface DeleteGroupResponse extends MutationResponse {
  data: {
    vrchat_group_id: number;
    group_name: string;
  };
}

export interface LogGroupResponse extends MutationResponse {
  data: {
    log_id: number;
    vrchat_group_id: string;
    discord_server_id: string;
    action_description: string;
  };
}

export interface AddGroupResponse extends MutationResponse {
  data: {
    vrchat_group_id: string;
    discord_server_id: string;
    group_name: string;
    log_id: number;
  };
}

// =========================================================================================================
// Service Input Types
// =========================================================================================================

export interface CreateProfileInput {
  vrchat_id: string;
  discord_id: string;
  vrchat_name: string;
}

export interface VerifyProfileInput {
  verification_id: number;
  verified_from: string;
}

export interface CreateStaffInput {
  discord_id: string;
  discord_name: string;
}

export interface ListProfilesFilters {
  limit?: number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
}
