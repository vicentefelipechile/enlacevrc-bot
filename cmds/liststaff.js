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
const { D1_PRIVATE_KEY, DISCORD_CLIENT_ID } = require('../src/env');
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

    // Create user request data (using bot credentials)
    const userRequestData = {
      discord_id: '356253258613915663',
      discord_name: 'EnlaceVRC-Bot'
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
