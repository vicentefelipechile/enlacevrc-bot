/**
 * @license MIT
 * @file cmds/deluser.js
 * @author vicentefelipechile
 * @description Script to delete user profile by Discord ID or VRChat ID
 */

// =================================================================
// Import Statements
// =================================================================

const PrintMessage = require('../src/print');
const { D1Class } = require('../src/d1class');
const { D1_PRIVATE_KEY } = require('../src/env');
const { exit } = require('process');
const { createInterface } = require('readline');

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
 * Prompts user for confirmation
 * @param {string} message - The message to display
 * @returns {Promise<boolean>} - True if confirmed
 */
const confirmAction = async (message) => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(
        answer.toLowerCase() === 's' ||
        answer.toLowerCase() === 'y' ||
        answer.toLowerCase() === 'sí' ||
        answer.toLowerCase() === 'si' ||
        answer.toLowerCase() === 'yes'
      );
    });
  });
};

// =================================================================
// Main Execution
// =================================================================

/**
 * Main function to delete user
 */
const DeleteUser = async () => {
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
      PrintMessage('Uso: npm run deluser <discord_id|vrchat_id>');
      PrintMessage('Ejemplos:');
      PrintMessage('  npm run deluser 1200647520427180054');
      PrintMessage('  npm run deluser usr_abf1e29b-3800-4cc6-b3ae-57f70bd010a7');
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

    // Create user request data (using bot credentials)
    const userRequestData = {
      discord_id: process.env.DISCORD_CLIENT_ID || '0',
      discord_name: 'EnlaceVRC-Bot'
    };

    // Get profile first to verify it exists
    PrintMessage(`🔍 Buscando perfil por ${idType}: ${userId}...`);
    
    let profile = null;
    try {
      profile = await D1Class.getProfile(userRequestData, userId, false);
    } catch (error) {
      PrintMessage(`❌ Error: No se encontró perfil para ${idType}: "${userId}"`);
      exit(1);
    }

    if (!profile) {
      PrintMessage(`❌ Error: No se encontró perfil para ${idType}: "${userId}"`);
      exit(1);
    }

    // Display profile information before deletion
    PrintMessage('═══════════════════════════════════════════════════════');
    PrintMessage('📋 Perfil a Eliminar:');
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
    
    PrintMessage('═══════════════════════════════════════════════════════');

    // Ask for confirmation
    const confirmed = await confirmAction('⚠️  ¿Estás seguro de que deseas eliminar este perfil? (sí/no): ');

    if (!confirmed) {
      PrintMessage('❌ Eliminación cancelada');
      exit(0);
    }

    // Delete profile
    PrintMessage('🗑️  Eliminando perfil...');
    
    await D1Class.deleteProfile(userRequestData, userId);

    PrintMessage('✅ Usuario eliminado exitosamente');
    PrintMessage(`   ${idType}: ${userId}`);

    exit(0);

  } catch (error) {
    PrintMessage(`❌ Error durante la eliminación del usuario: ${error.message}`);
    exit(1);
  }
};

// Execute main function
DeleteUser();
