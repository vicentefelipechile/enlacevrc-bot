/**
 * @license     MIT
 * @file        src/events/guildCreate.js
 * @author      vicentefelipechile
 * @description Event handler for when the bot joins a new guild.
 */

const { D1Class } = require("../d1class");
const PrintMessage = require("../print");

/**
 * Handles the guildCreate event.
 * Adds the new server to the database if it doesn't already exist.
 * 
 * @param {import("discord.js").Guild} guild The guild the bot joined.
 */
async function OnServerAdded(guild) {
    const serverId = guild.id;
    const serverName = guild.name;
    const botUser = guild.client.user;

    // User request data for the API, using the bot's identity
    const userRequestData = {
        discord_id: botUser.id,
        discord_name: botUser.username
    };

    PrintMessage(`Joined new guild: ${serverName} (${serverId})`);

    try {
        // Check if the server already exists in the database
        const exists = await D1Class.discordServerExists(userRequestData, serverId);

        if (exists) {
            PrintMessage(`Server ${serverName} (${serverId}) already exists in the database. Skipping.`);
            return;
        }

        // Add the server to the database
        PrintMessage(`Adding server ${serverName} (${serverId}) to the database...`);
        await D1Class.addDiscordServer(userRequestData, serverId, serverName);
        PrintMessage(`Successfully added server ${serverName} (${serverId}) to the database.`);

    } catch (error) {
        console.error(`Error handling guildCreate for ${serverName} (${serverId}):`, error);
    }
}

module.exports = { OnServerAdded };
