const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const PrintMessage = require("./src/print");
const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = require("./src/env");

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

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
    try {
        PrintMessage(`Registrando ${commandsToDeploy.length} comandos...`);

        const globalData = await rest.put(
            Routes.applicationCommands(DISCORD_CLIENT_ID),
            { body: commandsToDeploy }
        );

        PrintMessage(`Comandos registrados correctamente: ${globalData.length}`);
    } catch (error) {
        console.error(error);
    }
})();