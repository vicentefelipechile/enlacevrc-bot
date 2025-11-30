/**
 * @license MIT
 * @file cmds/addstaff.js
 * @author vicentefelipechile
 * @description Script to add a new staff member
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
 * Validates Discord ID format
 * @param {string} discordId - The Discord ID to validate
 * @returns {boolean} - True if valid Discord ID (only numbers)
 */
const isValidDiscordId = (discordId) => {
    return /^\d+$/.test(discordId);
};

// =================================================================
// Main Execution
// =================================================================

/**
 * Main function to add staff
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
        if (args.length < 2) {
            PrintMessage('❌ Error: Se requieren 2 argumentos');
            PrintMessage('Uso: npm run addstaff <discord_id> <discord_name>');
            PrintMessage('Ejemplo: npm run addstaff 123456789012345678 "Usuario#1234"');
            exit(1);
        }

        const [discordId, discordName] = args;

        // Validate Discord ID format
        if (!isValidDiscordId(discordId)) {
            PrintMessage(`❌ Error: Discord ID inválido: "${discordId}"`);
            PrintMessage('El Discord ID debe contener solo números');
            exit(1);
        }

        // Create user request data
        const userRequestData = {
            discord_id: DISCORD_STAFF_ID || '0',
            discord_name: VRCHAT_APPLICATION_NAME || 'EnlaceVRC-Bot'
        };

        // Check if staff already exists
        PrintMessage('🔍 Verificando si el staff ya existe...');

        let existingStaff = null;
        try {
            existingStaff = await D1Class.getStaff(userRequestData, discordId, false);
        } catch (error) {
            // Staff doesn't exist or error fetching, proceed
        }

        if (existingStaff) {
            PrintMessage(`❌ Error: El staff con ID "${discordId}" ya existe`);
            PrintMessage(`   Nombre actual: ${existingStaff.discord_name}`);
            exit(1);
        }

        // Create new staff
        PrintMessage('📝 Agregando nuevo staff...');

        const staffData = {
            discord_id: discordId,
            discord_name: discordName
        };

        await D1Class.createStaff(userRequestData, staffData);

        // Success message
        PrintMessage(`✅ Staff agregado exitosamente:`);
        PrintMessage(`   Discord ID: ${discordId}`);
        PrintMessage(`   Nombre: ${discordName}`);
        exit(0);
    } catch (error) {
        PrintMessage(`❌ Error durante la adición de staff: ${error.message}`);
        exit(1);
    }
})();
