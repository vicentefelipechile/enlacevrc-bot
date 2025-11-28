/**
 * @license MIT
 * @file cmds/removestaff.js
 * @author vicentefelipechile
 * @description Script to remove a staff member
 */

// =================================================================
// Import Statements
// =================================================================

const PrintMessage = require('../src/print');
const { D1Class } = require('../src/d1class');
const { D1_PRIVATE_KEY, DISCORD_CLIENT_ID } = require('../src/env');
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
 * Main function to remove staff
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
            PrintMessage('Uso: npm run removestaff <discord_id>');
            PrintMessage('Ejemplo: npm run removestaff 123456789012345678');
            exit(1);
        }

        const [discordId] = args;

        // Validate Discord ID format
        if (!isValidDiscordId(discordId)) {
            PrintMessage(`❌ Error: Discord ID inválido: "${discordId}"`);
            PrintMessage('El Discord ID debe contener solo números');
            exit(1);
        }

        // Create user request data (using bot credentials)
        const userRequestData = {
            discord_id: DISCORD_CLIENT_ID || '0',
            discord_name: 'EnlaceVRC-Bot'
        };

        // Check if staff exists
        PrintMessage('🔍 Verificando existencia del staff...');

        let existingStaff = null;
        try {
            existingStaff = await D1Class.getStaff(userRequestData, discordId, false);
        } catch (error) {
            // Staff likely doesn't exist
        }

        if (!existingStaff) {
            PrintMessage(`❌ Error: No se encontró un miembro del staff con ID "${discordId}"`);
            exit(1);
        }

        PrintMessage(`⚠️  Se eliminará al staff: ${existingStaff.discord_name} (${discordId})`);

        // Delete staff
        PrintMessage('🗑️  Eliminando staff...');

        await D1Class.deleteStaff(userRequestData, discordId);

        // Success message
        PrintMessage(`✅ Staff eliminado exitosamente`);
        exit(0);
    } catch (error) {
        PrintMessage(`❌ Error durante la eliminación de staff: ${error.message}`);
        exit(1);
    }
})();
