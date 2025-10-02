/**
 * @license     MIT
 * @file        src/vrchat.js
 * @author      vicentefelipechile
 * @description VRChat API integration and authentication management.
 */

// =================================================================================================
// Imports
// =================================================================================================

const { createInterface } = require('readline');
const { KeyvFile } = require('keyv-file');
const { VRChat } = require('vrchat');

const PrintMessage = require('./print.js');
const { VRCHAT_EMAIL_CONTACT, VRCHAT_APPLICATION_NAME, VRCHAT_USERNAME, VRCHAT_PASSWORD } = require('./env.js');

// =================================================================================================
// VRChat Client
// =================================================================================================

const COOKIE_FILE = 'data.json';
const VRCHAT_CLIENT = new VRChat({
  application: {
    contact: VRCHAT_EMAIL_CONTACT,
    name: VRCHAT_APPLICATION_NAME,
    version: '0.1.0',
  },
  authentication: {
    credentials: async () => ({
      username: VRCHAT_USERNAME,
      password: VRCHAT_PASSWORD,
    }),
  },
  keyv: new KeyvFile({ filename: COOKIE_FILE }),
});

// =================================================================================================
// Sign In Function
// =================================================================================================

/**
 * Signs in to the VRChat API.
 * @returns {Promise<VRChat>} - Authenticated VRChat client
 */
async function SignIn() {
  try {

    const { data: currentUser } = await VRCHAT_CLIENT
      .getCurrentUser({ throwOnError: true })
      .catch(() => {
        return VRCHAT_CLIENT.login({
          username: VRCHAT_USERNAME,
          password: VRCHAT_PASSWORD,
          twoFactorCode: async () => {
            return new Promise((resolve) => {
              createInterface({
                input: process.stdin,
                output: process.stdout,
              }).question('Enter your 2FA code: ', resolve);
            });
          },
          throwOnError: true,
        });
      });

    PrintMessage(`Signed in as ${currentUser.displayName} (${currentUser.id})`);

    return VRCHAT_CLIENT;
  } catch (error) {
    console.error('Failed to sign in to VRChat:\n\n', error);
  }
};

// =================================================================================================
// Exports
// =================================================================================================

module.exports = {
  SignIn,
  VRCHAT_CLIENT,
};