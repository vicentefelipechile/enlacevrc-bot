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
// VRChat Extended Class
// =================================================================================================

/**
 * Extended VRChat class with custom methods
 */
class VRChatExtended extends VRChat {
  /**
   * List ALL notifications for the current user (using /notifications endpoint)
   * This endpoint returns more complete notification data than /auth/user/notifications
   * @param {Object} options - Request options (e.g., { n: 10, offset: 0 })
   * @returns {Promise} - Response with data array containing all notifications
   */
  async listNotifications(options = {}) {
    return this._client.get({
      url: "/notifications",
      ...options
    });
  }

  /**
   * Respond to a group invitation
   * @param {string} notificationId - ID of the notification
   * @param {string} action - Action to perform ('accept' or 'decline')
   * @returns {Promise} - Response from VRChat API
   */
  async respondToGroupInvite(notificationId, action) {
    return this._client.put({
      url: `/auth/user/notifications/${notificationId}/accept`,
      data: {
        responseType: action
      }
    });
  }
}


// =================================================================================================
// VRChat Client
// =================================================================================================

const COOKIE_FILE = 'data.json';
const VRCHAT_CLIENT = new VRChatExtended({
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
              const rl = createInterface({
                input: process.stdin,
                output: process.stdout,
              });
              rl.question('Enter your 2FA code: ', (answer) => {
                rl.close();
                resolve(answer);
              });
            });
          },
          throwOnError: true,
        });
      });

    PrintMessage(`Signed in as ${currentUser.displayName} (${currentUser.id})`);

    const notifications = await VRCHAT_CLIENT.listNotifications();
    PrintMessage(`Found ${notifications.data.length} notification(s)`);


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