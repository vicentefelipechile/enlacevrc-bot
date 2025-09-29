/**
 * El Refugio Nocturno Discord Bot
 *
 * Module: VRChat Integration
 * Description: Adds functionality to interact with VRChat API.
 */

/**
 * Imports
 */


const { createInterface } = require('readline');
const { KeyvFile } = require('keyv-file');
const { VRChat } = require('vrchat');

const PrintMessage = require('./print.js');
const { VRCHAT_EMAIL_CONTACT, VRCHAT_APPLICATION_NAME, VRCHAT_USERNAME, VRCHAT_PASSWORD } = require('./env.js');


/**
 * VRChat API Client
 */

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

async function GetUserById(userId) {
  try {
    const response = await VRCHAT_CLIENT.getUser({
      path: { userId: userId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to get user by ID ${userId}:`, error);
    return null;
  }
};


module.exports = {
  SignIn,
  GetUserById,
  VRCHAT_CLIENT,
};