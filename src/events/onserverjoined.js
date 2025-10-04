/**
 * @license     MIT
 * @file        events/onserverjoined.js
 * @author      vicentefelipechile
 * @description Event handler for when the bot is added to a new server.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { LoadCommand } = require("js-discord-modularcommand");
const PrintMessage = require("../print");
const DiscordSettings = require("../models/discord");
const DISCORD_SERVER_SETTINGS = require("../models/discordsettings");

// =================================================================================================
// OnServerAdded Function
// =================================================================================================

async function OnServerAdded(guild) {
    try {
        // =========================================================================================
        // Command Registration
        // =========================================================================================
        PrintMessage(`Bot joined new server: ${guild.name} (ID: ${guild.id})`);
        
        // Load all commands from the commands directory
        const commandPath = join(__dirname, '..', 'commands');
        const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.js'));
        const commands = [];

        // Load each command file
        for (const file of commandFiles) {
            const filePath = join(commandPath, file);
            const command = require(filePath);
            LoadCommand(commands, command);
        }

        // Register commands specifically for this guild
        await guild.commands.set(commands.map(cmd => cmd.data));
        
        PrintMessage(`Successfully registered ${commands.length} commands for server: ${guild.name}`);

        // =========================================================================================
        // Default Settings Registration
        // =========================================================================================

        // Register default settings for the new guild
        const discordSettings = new DiscordSettings(guild.id);
        const result = await discordSettings.registerSettings({
            [DISCORD_SERVER_SETTINGS.VERIFICATION_ROLE]: null,
            [DISCORD_SERVER_SETTINGS.VERIFICATION_PLUS_ROLE]: null,
            [DISCORD_SERVER_SETTINGS.AUTO_NICKNAME]: false,
        });

        PrintMessage(`Default settings registered for server: ${guild.name} - ${JSON.stringify(result)}`);
    } catch (error) {
        console.error(`Error registering commands for guild ${guild.id}:`, error);
    }
}


// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = OnServerAdded;