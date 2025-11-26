/**
 * @license MIT
 * @file cmds/adduser.js
 * @author vicentefelipechile
 * @description Script to add a new user with Discord ID and VRChat ID linking using D1Class
 */

// =================================================================
// Import Statements
// =================================================================

const PrintMessage = require('../src/print');
const { D1Class } = require('../src/d1class');
const { D1_PRIVATE_KEY } = require('../src/env');
const { exit } = require('process');
const { VRCHAT_CLIENT } = require('../src/vrchat');

// =================================================================
// Validation Functions
// =================================================================

/**
 * Validates Discord ID format
 * @param {string} discordId - The Discord ID to validate
 * @returns {boolean} - True if valid Discord ID (only numbers)
 */
const isValidDiscordId = (discordId) => {
  return /^\d+$/.test(discordId);
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
// Main Execution
// =================================================================

/**
 * Main function to add user
 */
const AddUser = async () => {
  try {
    // Initialize D1Class if not already initialized
    if (!D1Class.apiKey) {
      D1Class.init({ apiKey: D1_PRIVATE_KEY });
    }

    // Get arguments from command line (skip first two: node and script path)
    const args = process.argv.slice(2);

    // Validate argument count
    if (args.length < 2) {
      PrintMessage('❌ Error: Se requieren 2 argumentos');
      PrintMessage('Uso: npm run adduser <discord_id> <vrchat_id>');
      PrintMessage('Ejemplo: npm run adduser 123456789012345678 usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX');
      exit(1);
    }

    const [discordId, vrchatId] = args;

    // Validate Discord ID format
    if (!isValidDiscordId(discordId)) {
      PrintMessage(`❌ Error: Discord ID inválido: "${discordId}"`);
      PrintMessage('El Discord ID debe contener solo números');
      exit(1);
    }

    // Validate VRChat ID format
    if (!isValidVRChatId(vrchatId)) {
      PrintMessage(`❌ Error: VRChat ID inválido: "${vrchatId}"`);
      PrintMessage('El VRChat ID debe tener el formato: usr_XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX');
      exit(1);
    }

    // Create user request data (using bot credentials)
    const userRequestData = {
      discord_id: process.env.DISCORD_CLIENT_ID || '0',
      discord_name: 'EnlaceVRC-Bot'
    };

    // Attempt to get existing profile
    PrintMessage('🔍 Verificando si el perfil ya existe...');
    
    let existingProfile = null;
    try {
      existingProfile = await D1Class.getProfile(userRequestData, vrhcatId, false);
    } catch (error) {
      // Profile doesn't exist, which is expected for new users
    }

    if (existingProfile) {
      PrintMessage(`❌ Error: El perfil de VRChat ID "${vrchatId}" ya existe`);
      exit(1);
    }

    // Create new profile
    PrintMessage('📝 Creando nuevo perfil...');
    
    const profileData = {
      vrchat_id: vrchatId,
      discord_id: discordId,
      vrchat_name: 'Unknown' // This will be updated later if needed
    };

    const vrchatResponse = await VRCHAT_CLIENT.getUser({
        path: {
            userId: vrchatId
        }
    })
    const vrchatData = vrchatResponse.data;
    if (vrchatData && vrchatData.displayName) {
        profileData.vrchat_name = vrchatData.displayName;
    }

    const response = await D1Class.createProfile(userRequestData, profileData);

    // Success message
    PrintMessage(`✅ Usuario agregado exitosamente:`);
    PrintMessage(`   Discord ID: ${discordId}`);
    PrintMessage(`   VRChat ID: ${vrchatId}`);
    PrintMessage(`✅ Perfil creado en la base de datos`);

  } catch (error) {
    PrintMessage(`❌ Error durante la adición del usuario: ${error.message}`);
  }
};

// Execute main function
AddUser();
