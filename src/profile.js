/**
 * Profile management module.
 * Handles user verification, banning, and data retrieval.
 * @author vicentefelipechile
 * @license MIT
 */

// =================================================================================================
// Imports
// =================================================================================================

const { D1_URL, D1_PRIVATE_KEY } = require('./env');
const { VRCHAT_CLIENT } = require('./vrchat');
const NodeCache = require('node-cache');

// =================================================================================================
// Variables
// =================================================================================================

const D1_ENDPOINT = D1_URL;
const D1_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${D1_PRIVATE_KEY}`,
}

const CACHE_DATA = new NodeCache({ stdTTL: 60 * 60 });  // Cache for 1 hour

// =================================================================================================
// User Data Functions
// =================================================================================================

/**
 * Get user data by ID.
 * @param {string} Id - The ID of the user.
 * @returns {Promise<Object|null>} - The user data or null if not found.
 */
async function GetUserData(Id) {
  if (CACHE_DATA.has(Id)) {
    return CACHE_DATA.get(Id);
  }

  const response = await fetch(`${D1_ENDPOINT}/${Id}`, {
    method: 'GET',
    headers: D1_HEADERS,
  });

  const data = await response.json();
  if (response.status !== 200) {
    return { success: false, data: null };
  }

  data.data.is_banned = data.data.is_banned === 1;
  data.data.is_verified = data.data.is_verified === 1;

  CACHE_DATA.set(Id, data);

  return data;
}

/**
 * Check if a user exists.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<boolean>} - True if the user exists, false otherwise.
 */
async function UserExists(discordId) {
  const response = await GetUserData(discordId);
  return response.success === true && response.data !== null;
}

/**
 * Delete user data.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<boolean>} - True if the user was successfully deleted, false otherwise.
 */
async function DeleteUserData(discordId) {
  const response = await fetch(`${D1_ENDPOINT}/${discordId}`, {
    method: 'DELETE',
    headers: D1_HEADERS,
  });
  if (response.status === 200) {
    CACHE_DATA.del(discordId);
    return true;
  }
  return false;
}

// =================================================================================================
// User Status Functions
// =================================================================================================

/**
 * Check if a user is banned.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<boolean>} - True if the user is banned, false otherwise.
 */
async function IsUserBanned(discordId) {
  const response = await GetUserData(discordId);
  return (
    response.success === true &&
    response.data.is_banned === true
  );
}

/**
 * Check if a user is verified.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<boolean>} - True if the user is verified, false otherwise.
 */

async function IsUserVerified(discordId) {
  const response = await GetUserData(discordId);
  return (
    response.success === true &&
    response.data.is_verified === true
  );
}


/**
 * Verify a user.
 * @param {string} discordId - The Discord ID of the user.
 * @param {string} vrchatId - The VRChat ID of the user.
 * @param {string} vrchatName - The VRChat name of the user.
 * @returns {Promise<boolean>} - True if the user was successfully verified, false otherwise.
 */
async function VerifyUser(discordId, vrchatId, vrchatName) {
  const isVerified = await IsUserVerified(discordId);
  if (isVerified) throw new Error('User is already verified.');

  const isBanned = await IsUserBanned(discordId);
  if (isBanned) throw new Error('User is banned.');

  const result = await fetch(D1_ENDPOINT, {
    method: 'POST',
    headers: D1_HEADERS,
    body: JSON.stringify({
      vrchat_id: vrchatId,
      discord_id: discordId,
      vrchat_name: vrchatName,
    }),
  });

  return result.status === 201;
}


/**
 * Unverify a user.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<boolean>} - True if the user was successfully unverified, false otherwise.
 */
async function UnverifyUser(discordId) {
  const isVerified = await IsUserVerified(discordId);
  if (!isVerified) throw new Error('User is not verified.');

  const data = await GetUserData(discordId);
  if (data.success !== true || data.data === null) {
    throw new Error('Failed to fetch user data.');
  }

  const result = await fetch(`${D1_ENDPOINT}/${discordId}`, {
    method: 'DELETE',
    headers: D1_HEADERS,
  });

  return result.status === 200;
}


/**
 * Get a user by their Discord ID.
 * @param {string} discordId - The Discord ID of the user.
 * @returns {Promise<{
 *  discord_id: string,
 *  vrchat_id: string,
 *  vrchat_name: string,
 *  verified_at: string,
 *  is_banned: boolean,
 * }|null>} - The user object if found, null otherwise.
 */
async function GetUserByDiscord(discordId) {
  const result = await fetch(`${D1_ENDPOINT}/${discordId}`, {
    method: 'GET',
    headers: D1_HEADERS,
  });

  if (result.status !== 200) {
    return { success: false, data: null };
  }

  const response = await result.json();

  return response.data;
}


/**
 * Get a user by their VRChat ID.
 * @param {string} vrchatId - The VRChat ID of the user.
 * @returns {Promise<{
 *  discord_id: string,
 *  vrchat_id: string,
 *  vrchat_name: string,
 *  verified_at: string,
 *  is_banned: boolean,
 * }|null>} - The user object if found, null otherwise.
 */
const GetUserByVRChat = GetUserByDiscord;


/**
 * Update the VRChat name of a user.
 * @param {string} discordId - The Discord ID of the user.
 */
async function UpdateName(discordId) {
  const userData = await GetUserByDiscord(discordId);
  const response = await VRCHAT_CLIENT.getUser(userData.vrchat_id);

  if (response.response.status === 200) {
    const vrchatName = response.data.displayName;
    const result = await fetch(D1_ENDPOINT, {
      method: 'PUT',
      headers: D1_HEADERS,
      body: JSON.stringify({
        discord_id: discordId,
        vrchat_name: vrchatName,
      }),
    });

    if (result.status === 200) {
      PrintMessage(`Updated VRChat name for Discord ID ${discordId}: ${vrchatName}`);
    }
  }

  PrintMessage(`Error fetching VRChat user data for Discord ID ${discordId}`);
  PrintMessage(`VRChat API response: ${JSON.stringify(response)}`);
}

/**
 * Generate code by vrchat profile
 * @param {string} vrchatId - The VRChat ID of the user.
 * @returns {string} - The generated code.
 */
function GenerateCodeByVRChat(vrchatId) {
  const idParts = vrchatId.substring(4).split('-');
  const firstPart = idParts[0];
  const lastPart = idParts[idParts.length - 1];
  const code = `${firstPart.substring(0, 3)}${lastPart.substring(lastPart.length - 3)}`.toUpperCase();

  return code;
}

const RegexURL = new RegExp(/^(?:https?:\/\/)?(?:www\.)?vrchat\.com\/home\/user\/(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);
const RegexID = new RegExp(/^(usr_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/);

function GetVRChatId(code) {
  const match = code.match(RegexURL);
  if (match && match[1]) return match[1];
  if (RegexID.test(code)) return code;
  return null;
}

// =================================================================================================
// Exports
// =================================================================================================

module.exports = {
  GetUserData,
  DeleteUserData,
  UserExists,
  IsUserBanned,
  IsUserVerified,
  VerifyUser,
  UnverifyUser,
  GetUserByDiscord,
  GetUserByVRChat,
  UpdateName,
  GenerateCodeByVRChat,
  GetVRChatId,
};