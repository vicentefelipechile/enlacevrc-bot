const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const { LoadCommand, ModularCommandHandler } = require("js-discord-modularcommand");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { DISCORD_TOKEN } = require("./src/env");
const PrintMessage = require("./src/print");
const { SignIn } = require("./src/vrchat");


const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
    ]
})

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

client.on(Events.InteractionCreate, ModularCommandHandler(client));

client.once(Events.ClientReady, async () => {
    PrintMessage(`Logged in as ${client.user.tag}`);
    await SignIn();
});

client.login(DISCORD_TOKEN);