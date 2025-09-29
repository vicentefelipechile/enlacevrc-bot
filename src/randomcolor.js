/**
 * El Refugio Nocturno Discord Bot
 *
 * Module: Get Random Color
 * Description: Get a random color from the Colors enum in discord.js.
 */

const { Colors } = require('discord.js');

/**
 * Get a random color from the Colors enum in discord.js.
 * @returns {Colors} The random color.
 * @description This function randomly selects a color from the Colors enum provided by discord.js.
 * It can be used to assign random colors to embeds, messages, or other elements in Discord.
 */
function GetRandomColor() {
  return Object.values(Colors)[Math.floor(Math.random() * Object.values(Colors).length)];
}

module.exports = GetRandomColor;