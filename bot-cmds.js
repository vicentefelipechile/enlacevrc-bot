/**
 * @license     MIT
 * @file        deploy-commands.js
 * @author      vicentefelipechile
 * @description Script to deploy Discord bot commands using Discord.js REST API.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

// Modules
const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");

// Project Modules
const { DISCORD_TOKEN, DISCORD_CLIENT_ID, D1_PRIVATE_KEY, VRCHAT_APPLICATION_NAME } = require("./src/env");
const PrintMessage = require("./src/print");
const { exit } = require("node:process");
const { D1Class } = require("./src/d1class");

// =================================================================================================
// Command Deployment
// =================================================================================================

D1Class.init({ apiKey: D1_PRIVATE_KEY })

const commandsToDeploy = [];

const commandPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandPath, file);
    const commandModule = require(filePath);

    const commands = Array.isArray(commandModule) ? commandModule : [commandModule];

    for (const command of commands) {
        if (command.data && typeof command.execute === 'function') {
            commandsToDeploy.push(command.data.toJSON());
        } else {
            PrintMessage(`[WARNING] El archivo ${filePath} no contiene un comando válido.`);
        }
    }
}

// =================================================================================================
// Register Commands with Discord API
// =================================================================================================

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
    try {
        PrintMessage(`Registrando ${commandsToDeploy.length} comandos...`);

        const globalData = await rest.put(
            Routes.applicationCommands(DISCORD_CLIENT_ID),
            { body: commandsToDeploy }
        );

        const userRequestData = {
            discord_id: DISCORD_CLIENT_ID,
            discord_name: VRCHAT_APPLICATION_NAME
        }

        /**
         * List all Discord servers where the bot is installed
         * @returns {Promise<Array<Object>>} Array of Discord servers
         * @returns {string} discordServers[].discord_server_id - The Discord server ID
         * @returns {string} discordServers[].discord_server_name - The Discord server name
         */
        const discordServers = await D1Class.listDiscordServers(userRequestData);

        for (const server of discordServers) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, server.discord_server_id),
                    { body: commandsToDeploy }
                );
                PrintMessage(`Comandos registrados en servidor: ${server.discord_server_name}`);
            } catch (error) {
                PrintMessage(`[ERROR] No se pudieron registrar comandos en ${server.discord_server_name}: ${error.message}`);
            }
        }

        PrintMessage(`Comandos registrados correctamente: ${globalData.length}`);
        exit(0);
    } catch (error) {
        console.error(error);
    }
})();