/**
 * @license     MIT
 * @file        bot.js
 * @author      vicentefelipechile
 * @description Main Discord bot file for managing commands and events, including VRChat integration and modular command handling.
 */

// =================================================================================================
// Import Statements
// =================================================================================================

// Modules
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const { LoadCommand, ModularCommandHandler } = require("js-discord-modularcommand");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");

// Project Modules
const { SignIn } = require("./src/vrchat");
const { DISCORD_TOKEN } = require("./src/env");
const PrintMessage = require("./src/print");
const { D1Class } = require("./src/d1class");
const env = require("./src/env");
const { OnServerAdded } = require("./src/events/guildCreate");

D1Class.init({ apiKey: env.D1_PRIVATE_KEY });


// =================================================================================================
// Bot Initialization
// =================================================================================================

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
    ]
})

// =================================================================================================
// Bot Commands Initialization
// =================================================================================================

client.commands = new Collection();

const commandPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const filePath = join(commandPath, file);
    const command = require(filePath);

    LoadCommand(commands, command);
};

for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
}

// =================================================================================================
// Bot Event Handlers
// =================================================================================================

client.on(Events.InteractionCreate, ModularCommandHandler(client));

client.on(Events.GuildCreate, OnServerAdded);

client.once(Events.ClientReady, async () => {
    PrintMessage(`Logged in as ${client.user.tag}`);
    await SignIn();
});

// =================================================================================================
// Bot Login
// =================================================================================================

client.login(DISCORD_TOKEN);

// =================================================================================================
// Graceful Shutdown Handlers
// =================================================================================================

/**
 * Gracefully shutdown the bot when receiving termination signals
 */
async function gracefulShutdown(signal) {
    // PrintMessage(`Received ${signal}, shutting down gracefully...`);
    // Destroy the Discord client connection
    client.destroy();
    PrintMessage('Discord client disconnected successfully.');

    // Exit the process
    process.exit(0);
}

// Handle SIGINT (CTRL+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});