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
const OnServerAdded = require("./src/events/onserverjoined");


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