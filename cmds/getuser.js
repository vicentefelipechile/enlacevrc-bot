/**
 * @license MIT
 * @file cmds/getuser.js
 * @author vicentefelipechile
 * @description Script to retrieve and display user profile information by Discord ID or VRChat ID
 */

// =================================================================
// Import Statements
// =================================================================

const PrintMessage = require('../src/print');
const { D1Class } = require('../src/d1class');
const { D1_PRIVATE_KEY, DISCORD_STAFF_ID, VRCHAT_APPLICATION_NAME } = require('../src/env');
const { exit } = require('process');

// =================================================================
// Validation Functions
// =================================================================

/**
 * Validates if input contains only numbers (Discord ID)
 * @param {string} input - The input to validate
 * @returns {boolean} - True if input contains only numbers
 */
const isNumeric = (input) => {
  return /^\d+$/.test(input);
};

/**
 * Validates VRChat ID format
 * @param {string} vrchatId - The VRChat ID to validate
 * @returns {boolean} - True if valid VRChat ID
 */
const isValidVRChatId = (vrchatId) => {
  return /^usr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(vrchatId);
};

// =================================================================
// Utility Functions
// =================================================================

/**
 * Formats and displays profile information
 * @param {Object} profile - The profile data
 */
const displayProfile = (profile) => {
  PrintMessage('═══════════════════════════════════════════════════════');
  PrintMessage('📋 Información del Perfil:');
  PrintMessage('═══════════════════════════════════════════════════════');

  if (profile.discord_id) {
    PrintMessage(`   Discord ID: ${profile.discord_id}`);
  }

  if (profile.vrchat_id) {
    PrintMessage(`   VRChat ID: ${profile.vrchat_id}`);
  }

  if (profile.vrchat_name) {
    PrintMessage(`   VRChat Name: ${profile.vrchat_name}`);
  }

  if (profile.is_verified !== undefined) {
    PrintMessage(`   Verified: ${profile.is_verified ? '✅ Yes' : '❌ No'}`);
  }

  if (profile.is_banned !== undefined) {
    PrintMessage(`   Banned: ${profile.is_banned ? '❌ Yes' : '✅ No'}`);
  }

  if (profile.banned_reason) {
    PrintMessage(`   Ban Reason: ${profile.banned_reason}`);
  }

  if (profile.created_at) {
    PrintMessage(`   Created At: ${profile.created_at}`);
  }

  if (profile.updated_at) {
    PrintMessage(`   Updated At: ${profile.updated_at}`);
  }

  PrintMessage('═══════════════════════════════════════════════════════');
};

// =================================================================
// Main Execution
// =================================================================

/**
 * Main function to get user information
 */
(async () => {
  try {
    // Initialize D1Class if not already initialized
    if (!D1Class.apiKey) {
      D1Class.init({ apiKey: D1_PRIVATE_KEY });
    }

    // Get arguments from command line (skip first two: node and script path)
    const args = process.argv.slice(2);

    // Validate argument count
    if (args.length < 1) {
      PrintMessage('❌ Error: Se requiere 1 argumento');
      PrintMessage('Uso: npm run getuser <discord_id|vrchat_id>');
      PrintMessage('Ejemplos:');
      PrintMessage('  npm run getuser 1200647520427180054');
      PrintMessage('  npm run getuser usr_abf1e29b-3800-4cc6-b3ae-57f70bd010a7');
      exit(1);
    }

    const userId = args[0];
    let idType = '';

    // Determine ID type
    if (isNumeric(userId)) {
      idType = 'Discord ID';
    } else if (isValidVRChatId(userId)) {
      idType = 'VRChat ID';
    } else {
      PrintMessage(`❌ Error: ID inválido: "${userId}"`);
      PrintMessage('Debe ser un Discord ID (solo números) o VRChat ID (usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)');
      exit(1);
    }

    // Create user request data
    const userRequestData = {
      discord_id: DISCORD_STAFF_ID || '0',
      discord_name: VRCHAT_APPLICATION_NAME || 'EnlaceVRC-Bot'
    };

    // Get profile
    PrintMessage(`🔍 Buscando perfil por ${idType}: ${userId}...`);

    const profile = await D1Class.getProfile(userRequestData, userId, false);

    if (!profile) {
      PrintMessage(`❌ Error: No se encontró perfil para ${idType}: "${userId}"`);
      exit(1);
    }

    // Display profile information
    displayProfile(profile);
    PrintMessage('✅ Información del perfil obtenida exitosamente');

  } catch (error) {
    PrintMessage(`❌ Error durante la búsqueda del usuario: ${error.message}`);
  }
})();
