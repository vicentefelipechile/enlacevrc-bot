/**
 * @license     MIT
 * @file        src/randomcolor.js
 * @author      vicentefelipechile
 * @description Utility function to get a random color from the Colors enum in discord.js.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { Colors } = require('discord.js');

// =================================================================================================
// GetRandomColor Function
// =================================================================================================

/**
 * Get a random color from the Colors enum in discord.js.
 * @returns {Colors} The random color.
 * @description This function randomly selects a color from the Colors enum provided by discord.js.
 * It can be used to assign random colors to embeds, messages, or other elements in Discord.
 */
function GetRandomColor() {
  return Object.values(Colors)[Math.floor(Math.random() * Object.values(Colors).length)];
}

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = GetRandomColor;