/**
 * @license     MIT
 * @file        env.js
 * @author      vicentefelipechile
 * @description Environment variable configuration for the Discord bot and VRChat integration.
 */

// =================================================================================================
// Load Environment Variables
// =================================================================================================

require('dotenv').config();

// =================================================================================================
// Export Environment Variables
// =================================================================================================

module.exports = {
    // Discord Bot Info
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,

    // Cloudflare D1
    D1_PRIVATE_KEY: process.env.D1_PRIVATE_KEY,
    D1_URL: process.env.D1_URL,

    // VRChat Info
    VRCHAT_USERNAME: process.env.VRCHAT_USERNAME,
    VRCHAT_PASSWORD: process.env.VRCHAT_PASSWORD,
    VRCHAT_EMAIL_CONTACT: process.env.VRCHAT_EMAIL_CONTACT,
    VRCHAT_APPLICATION_NAME: process.env.VRCHAT_APPLICATION_NAME,
};