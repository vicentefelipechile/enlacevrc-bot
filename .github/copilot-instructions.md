<coding-guidelines>
    <!-- Global Rules Applied to All Files -->
    <global-rules applyTo="All Files">
        <metadata>
            <rule>Each script must begin with JSDoc meta-information using /** */ comments</rule>
            <rule>When working with Discord.js components, always import the necessary builders and types</rule>
            <required-fields>
                <field name="@license">Always use "MIT" to maintain consistency</field>
                <field name="@file">Relative script path from root (e.g., "src/commands/verification.js", "src/models/profile.js")</field>
                <field name="@author">Author name (use "vicentefelipechile" as default)</field>
                <field name="@description">Brief description of the script's functionality</field>
            </required-fields>
        </metadata>
        <structure>
            <imports>
                <rule>Group imports in sections with clear comment headers using "=" characters (65 characters wide)</rule>
                <rule>Order: Discord.js imports, third-party modules, project modules</rule>
                <rule>Use section comment: "// ================================================================================================="</rule>
                <rule>Use section comment: "// Import Statements" or "// Imports"</rule>
                <rule>Use section comment: "// ================================================================================================="</rule>
            </imports>
            <sections>
                <rule>Use comment separators with "=" characters (65 characters wide) for major sections</rule>
                <rule>Each major functionality should have its own section</rule>
                <rule>Common sections: Import Statements, Variables, Localization, Command/Function Logic, Export Statement</rule>
            </sections>
        </structure>
    </global-rules>
    <!-- Discord Bot Specific Rules -->
    <discord-bot-rules applyTo="src/commands/*.js">
        <command-structure>
            <initialization>
                <rule>Create ModularCommand instance first with clear command name</rule>
                <rule>Set basic description before localization using setDescription()</rule>
                <rule>Set cooldown with setCooldown() method</rule>
                <rule>Add permission checks with setPermissionCheck() when needed</rule>
            </initialization>
            <options>
                <rule>Add command options using addOption() method</rule>
                <rule>Use proper ApplicationCommandOptionType imports</rule>
                <rule>Set required field appropriately</rule>
                <rule>Provide clear option descriptions</rule>
            </options>
            <subcommands>
                <rule>Add subcommands using addSubCommand() method</rule>
                <rule>Each subcommand should have name, description, and options array</rule>
                <rule>Use consistent naming: SUBCOMMANDS_NAME object for organization</rule>
            </subcommands>
        </command-structure>
        <localization>
            <rule>Use Locale enum from discord.js for consistency</rule>
            <rule>Always include at least EnglishUS, SpanishLATAM, and SpanishES</rule>
            <rule>Use setLocalizationDescription() for command descriptions</rule>
            <rule>Use setLocalizationPhrases() for all user-facing text</rule>
            <rule>Use setLocalizationOptions() for option names</rule>
            <rule>Use setLocalizationSubCommands() for subcommand localization</rule>
            <rule>Key naming convention: 'category.element.property' (e.g., 'error.not_verified', 'embed.title')</rule>
            <spanish-variants>
                <rule>SpanishLATAM: Professional, neutral Spanish</rule>
                <rule>SpanishES: Exaggerated, stereotypically Spanish speech with expressions like "¡Madre mía Willy!", "¡Ostras chaval!", "¡Tío!", "¡Joder macho!", and other stereotypical Spanish idioms</rule>
            </spanish-variants>
        </localization>
        <button-components>
            <rule>Create buttons using addButton() method on command instance</rule>
            <rule>Use descriptive custom IDs</rule>
            <rule>Set button style and emoji using getButton() method</rule>
            <rule>Handle button interactions with async functions</rule>
            <rule>Use interaction.deferUpdate() for button responses</rule>
            <rule>Build buttons with build(locale) method for localized labels</rule>
        </button-components>
        <execution-logic>
            <rule>Use setExecute() method for main command logic</rule>
            <rule>Destructure parameters: { interaction, locale, args, command }</rule>
            <rule>Always use await interaction.deferReply() at the start</rule>
            <rule>Use interaction.editReply() for responses</rule>
            <rule>Handle errors gracefully with try-catch blocks</rule>
            <rule>Use locale object for all user-facing text</rule>
        </execution-logic>
        <exports>
            <rule>Always wrap commands with RegisterCommand() function</rule>
            <rule>Use module.exports for CommonJS compatibility</rule>
            <rule>Export array of commands: RegisterCommand([command])</rule>
        </exports>
    </discord-bot-rules>
    <!-- Model Classes Rules -->
    <model-rules applyTo="src/models/*.js">
        <class-structure>
            <constructor>
                <rule>Initialize all properties with sensible defaults</rule>
                <rule>Set up static properties for shared functionality (cache, endpoints, headers)</rule>
                <rule>Use lazy initialization pattern for static properties</rule>
            </constructor>
            <static-methods>
                <rule>Implement CRUD operations as static methods (add, get, update, delete)</rule>
                <rule>Provide factory methods (create, createEmpty, createUser)</rule>
                <rule>Include utility methods for ID validation and processing</rule>
                <rule>Use consistent error handling with try-catch blocks</rule>
            </static-methods>
            <instance-methods>
                <rule>Implement instance-specific operations (load, save, remove)</rule>
                <rule>Provide getter/setter methods for properties</rule>
                <rule>Include validation methods (exists, isVerified, isBanned)</rule>
                <rule>Use async/await pattern consistently</rule>
            </instance-methods>
        </class-structure>
        <caching>
            <rule>Use NodeCache for performance optimization</rule>
            <rule>Set appropriate TTL values based on data volatility</rule>
            <rule>Clear cache when data is modified</rule>
            <rule>Check cache before making API calls</rule>
        </caching>
        <api-integration>
            <rule>Use environment variables for API endpoints and keys</rule>
            <rule>Implement proper error handling for API failures</rule>
            <rule>Use fetch() for HTTP requests with proper headers</rule>
            <rule>Handle rate limiting and API response codes</rule>
        </api-integration>
        <data-validation>
            <rule>Validate input parameters in all methods</rule>
            <rule>Use specific error messages for different failure cases</rule>
            <rule>Check for required fields before processing</rule>
            <rule>Sanitize user input when necessary</rule>
        </data-validation>
    </model-rules>
    <!-- Environment and Configuration -->
    <environment-rules applyTo="src/env.js">
        <structure>
            <rule>Load dotenv at the top of the file</rule>
            <rule>Group environment variables by category (Discord, Database, VRChat)</rule>
            <rule>Use descriptive comments for each section</rule>
            <rule>Export all variables in a single module.exports object</rule>
        </structure>
        <naming>
            <rule>Use SCREAMING_SNAKE_CASE for environment variable names</rule>
            <rule>Prefix variables by service (DISCORD_, VRCHAT_, D1_)</rule>
            <rule>Use descriptive names that indicate purpose</rule>
        </naming>
    </environment-rules>
    <!-- Utility Functions -->
    <utility-rules applyTo="src/*.js">
        <print-utility>
            <rule>Use consistent timestamp format in PrintMessage</rule>
            <rule>Include service identifier in log messages [EnlaceVRC]</rule>
            <rule>Support multiple message parameters with separator</rule>
        </print-utility>
        <color-utility>
            <rule>Use Discord.js Colors enum for consistency</rule>
            <rule>Implement random selection from available colors</rule>
            <rule>Document the purpose and usage of utility functions</rule>
        </color-utility>
        <vrchat-integration>
            <rule>Handle authentication and session management</rule>
            <rule>Implement proper error handling for VRChat API</rule>
            <rule>Use readline interface for 2FA input</rule>
            <rule>Store session data securely using keyv-file</rule>
        </vrchat-integration>
    </utility-rules>
    <!-- Event Handlers -->
    <event-rules applyTo="src/events/**/*.js">
        <structure>
            <rule>Use descriptive function names (OnServerAdded, OnMemberJoin)</rule>
            <rule>Handle both success and error cases</rule>
            <rule>Log important events using PrintMessage</rule>
            <rule>Use async functions for all event handlers</rule>
        </structure>
        <server-management>
            <rule>Register default settings when bot joins new server</rule>
            <rule>Set up guild-specific commands if needed</rule>
            <rule>Initialize bot permissions and roles</rule>
            <rule>Log server information for monitoring</rule>
        </server-management>
    </event-rules>
    <!-- Main Bot File -->
    <bot-rules applyTo="bot.js">
        <initialization>
            <rule>Set up Discord client with required intents</rule>
            <rule>Initialize command collection using Discord.js Collection</rule>
            <rule>Load commands from commands directory dynamically</rule>
            <rule>Register event handlers for important events</rule>
        </initialization>
        <command-loading>
            <rule>Use LoadCommand function from js-discord-modularcommand</rule>
            <rule>Filter for .js files in commands directory</rule>
            <rule>Handle command loading errors gracefully</rule>
            <rule>Store commands in client.commands collection</rule>
        </command-loading>
        <event-handling>
            <rule>Use Events enum from discord.js for event names</rule>
            <rule>Handle InteractionCreate with ModularCommandHandler</rule>
            <rule>Set up ClientReady event for initialization tasks</rule>
            <rule>Register custom event handlers (GuildCreate, etc.)</rule>
        </event-handling>
    </bot-rules>
    <!-- Naming Conventions -->
    <naming-conventions>
        <files>
            <rule>Use lowercase with hyphens for command files (verification.js, view-profile.js)</rule>
            <rule>Use camelCase for utility files (randomcolor.js, print.js)</rule>
            <rule>Use descriptive names that indicate functionality</rule>
        </files>
        <variables>
            <rule>Use camelCase for variables and functions</rule>
            <rule>Use PascalCase for classes and constructors</rule>
            <rule>Use SCREAMING_SNAKE_CASE for constants</rule>
            <rule>Use descriptive names that indicate purpose</rule>
        </variables>
        <constants>
            <rule>Group related constants in objects (DISCORD_SERVER_SETTINGS)</rule>
            <rule>Use descriptive constant names</rule>
            <rule>Define constants at the top of files or in dedicated sections</rule>
        </constants>
    </naming-conventions>
    <!-- Error Handling -->
    <error-handling>
        <patterns>
            <rule>Use try-catch blocks for all async operations</rule>
            <rule>Provide user-friendly error messages</rule>
            <rule>Log detailed errors for debugging</rule>
            <rule>Use appropriate HTTP status codes for API responses</rule>
        </patterns>
        <user-feedback>
            <rule>Show localized error messages to users</rule>
            <rule>Provide helpful suggestions when operations fail</rule>
            <rule>Use different error messages for different failure cases</rule>
            <rule>Include relevant context in error messages</rule>
        </user-feedback>
    </error-handling>
    <!-- Security Practices -->
    <security>
        <environment-variables>
            <rule>Never commit .env files to version control</rule>
            <rule>Use secure authentication tokens</rule>
            <rule>Validate all user input before processing</rule>
            <rule>Use proper authorization checks for sensitive operations</rule>
        </environment-variables>
        <data-handling>
            <rule>Sanitize user input in embeds and messages</rule>
            <rule>Validate Discord IDs and VRChat IDs format</rule>
            <rule>Use secure HTTP headers for API requests</rule>
            <rule>Implement proper session management</rule>
        </data-handling>
    </security>
    <!-- Performance Optimization -->
    <performance>
        <caching>
            <rule>Cache frequently accessed data with appropriate TTL</rule>
            <rule>Clear cache when data is modified</rule>
            <rule>Use different cache strategies for different data types</rule>
            <rule>Monitor cache hit rates and effectiveness</rule>
        </caching>
        <api-usage>
            <rule>Minimize API calls through caching</rule>
            <rule>Use batch operations when possible</rule>
            <rule>Handle rate limiting gracefully</rule>
            <rule>Implement retry logic for transient failures</rule>
        </api-usage>
    </performance>
    <!-- Testing and Quality -->
    <quality-assurance>
        <code-organization>
            <rule>Keep functions focused on single responsibilities</rule>
            <rule>Use meaningful variable and function names</rule>
            <rule>Comment complex logic and business rules</rule>
            <rule>Maintain consistent code formatting</rule>
        </code-organization>
        <documentation>
            <rule>Document all public methods with JSDoc</rule>
            <rule>Include usage examples in complex functions</rule>
            <rule>Explain business logic and integration points</rule>
            <rule>Keep documentation up to date with code changes</rule>
        </documentation>
    </quality-assurance>
</coding-guidelines>