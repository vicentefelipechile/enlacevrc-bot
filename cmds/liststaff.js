/**
 * @license MIT
 * @file cmds/liststaff.js
 * @author vicentefelipechile
 * @description Script to list all available staff members
 */

// =================================================================
// Import Statements
// =================================================================

const PrintMessage = require('../src/print');
const { D1Class } = require('../src/d1class');
const { D1_PRIVATE_KEY, DISCORD_CLIENT_ID, DISCORD_STAFF_ID, VRCHAT_APPLICATION_NAME } = require('../src/env');
const { exit } = require('process');

// =================================================================
// Utility Functions
// =================================================================

/**
 * Formats and displays staff list
 * @param {Array} staffList - Array of staff members
 */
const displayStaffList = (staffList) => {
  if (!staffList || staffList.length === 0) {
    PrintMessage('❌ No hay miembros de staff disponibles');
    return;
  }

  PrintMessage('═══════════════════════════════════════════════════════');
  PrintMessage(`📋 Miembros de Staff (Total: ${staffList.length})`);
  PrintMessage('═══════════════════════════════════════════════════════');

  staffList.forEach((staff, index) => {
    PrintMessage('');
    PrintMessage(`${index + 1}. Discord ID:  ${staff.discord_id}`);
    PrintMessage(`   Nombre:\t  ${staff.discord_name}`);
    PrintMessage(`   Agregado:\t  ${staff.added_at}`);
    PrintMessage('');
  });

  PrintMessage('═══════════════════════════════════════════════════════');
};

// =================================================================
// Main Execution
// =================================================================

/**
 * Main function to list all staff members
 */
(async () => {
  try {
    // Initialize D1Class if not already initialized
    if (!D1Class.apiKey) {
      D1Class.init({ apiKey: D1_PRIVATE_KEY });
    }

    // Create user request data
    const userRequestData = {
      discord_id: DISCORD_STAFF_ID || '0',
      discord_name: VRCHAT_APPLICATION_NAME || 'EnlaceVRC-Bot'
    };

    // Get staff list
    PrintMessage('🔍 Obteniendo lista de staff...');

    const staffList = await D1Class.listStaff(userRequestData, false);

    // Display staff list
    displayStaffList(staffList);
    PrintMessage('✅ Lista de staff obtenida exitosamente');
  } catch (error) {
    PrintMessage(`❌ Error durante la obtención de staff: ${error.message}`);
    exit(1);
  }
})();
