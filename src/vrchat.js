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
   * Respond to a notification
   * @param {Object} options - Request options
   * @param {Object} options.path - Path parameters
   * @param {string} options.path.notificationId - ID of the notification
   * @param {Object} options.body - Body parameters
   * @param {string} options.body.data - Action to perform
   * @param {string} options.body.type - Type of the notification
   * @returns {Promise} - Response from VRChat API
   */
  async respondToNotification(options) {
    return this._client.post({
      url: `/notifications/${options.path.notificationId}/respond`,
      body: {
        responseData: options.body.data || '',
        responseType: options.body.type,
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
    version: '1.0.0',
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
// Notification Functions
// =================================================================================================

async function HandleNotifications(notifications) {
  for (const notification of notifications.data) {
    switch (notification.type) {
      case 'group.invite':
        let declineData = null;

        for (const action of notification.responses) {
          if (action.type === 'decline') {
            declineData = action.data;
            break;
          }
        }

        if (!declineData) {
          PrintMessage(`No reject info found for notification "${notification.id}" wtf?`);
          continue;
        }

        await VRCHAT_CLIENT.respondToNotification({
          path: {
            notificationId: notification.id,
          },
          body: {
            data: declineData,
            type: 'decline',
          },
        });
        PrintMessage(`Declined group invite from "${notification.data.groupName}"`);
        break;

      case 'group.announcement':
        let markAsReadData = null;

        for (const action of notification.responses) {
          if (action.type === 'delete') {
            markAsReadData = action.data;
            break;
          }
        }

        if (!markAsReadData) {
          PrintMessage(`No mark as read info found for notification "${notification.id}" wtf?`);
          continue;
        }

        await VRCHAT_CLIENT.respondToNotification({
          path: {
            notificationId: notification.id,
          },
          body: {
            data: markAsReadData,
            type: 'delete',
          },
        });

        PrintMessage(`Marked as read group announcement from "${notification.data.announcementTitle}"`);
        break;

      default:
        PrintMessage(`Unknown notification type: ${notification.type}`);
        break;
    }
  }
}


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

    await HandleNotifications(notifications);

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