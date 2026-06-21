// =========================================================================================================
// VRChat Service
// =========================================================================================================
// VRChat API integration: an extended client exposing the raw /notifications endpoints (not covered by
// the SDK surface), plus sign-in with interactive 2FA and automatic handling of incoming group
// notifications (declining invites, marking announcements as read).

import { createInterface } from "node:readline";

import { KeyvFile } from "keyv-file";
import { VRChat } from "vrchat";

import { env } from "../config/env.js";
import { printMessage } from "../lib/logger.js";

// =========================================================================================================
// Constants
// =========================================================================================================

const COOKIE_FILE = "data.json";
const APPLICATION_VERSION = "1.0.0";

// =========================================================================================================
// Types
// =========================================================================================================

/** A single response action attached to a VRChat notification (e.g. "decline", "delete"). */
interface NotificationResponse {
  type: string;
  data: string;
}

interface Notification {
  id: string;
  type: string;
  responses: NotificationResponse[];
  data: {
    groupName?: string;
    announcementTitle?: string;
  };
}

interface NotificationsResult {
  data: Notification[];
}

interface RespondOptions {
  path: { notificationId: string };
  body: { data?: string; type: string };
}

// =========================================================================================================
// VRChat Extended Client
// =========================================================================================================

/**
 * Extends the VRChat SDK with the richer /notifications endpoints. These are not part of the generated
 * SDK surface, so we reach into the protected `_client` to issue raw requests.
 */
class VRChatExtended extends VRChat {
  /**
   * Lists all notifications via /notifications, which returns more complete data than the SDK's
   * /auth/user/notifications.
   */
  listNotifications(options: Record<string, unknown> = {}): Promise<NotificationsResult> {
    // The SDK doesn't type this endpoint; cast through unknown to the shape we rely on.
    return this._client.get({
      url: "/notifications",
      ...options,
    }) as unknown as Promise<NotificationsResult>;
  }

  /** Responds to a notification (accept/decline/delete) with the given action data. */
  respondToNotification(options: RespondOptions): Promise<unknown> {
    return this._client.post({
      url: `/notifications/${options.path.notificationId}/respond`,
      body: {
        responseData: options.body.data ?? "",
        responseType: options.body.type,
      },
    });
  }
}

// =========================================================================================================
// Client Instance
// =========================================================================================================

export const VRCHAT_CLIENT = new VRChatExtended({
  application: {
    contact: env.VRCHAT_EMAIL_CONTACT,
    name: env.VRCHAT_APPLICATION_NAME,
    version: APPLICATION_VERSION,
  },
  authentication: {
    credentials: () =>
      Promise.resolve({
        username: env.VRCHAT_USERNAME,
        password: env.VRCHAT_PASSWORD,
      }),
  },
  keyv: new KeyvFile({ filename: COOKIE_FILE }),
});

// =========================================================================================================
// Helpers
// =========================================================================================================

/** Finds the action data for a given response type on a notification, or null if absent. */
function findResponseData(notification: Notification, responseType: string): string | null {
  for (const action of notification.responses) {
    if (action.type === responseType) {
      return action.data;
    }
  }
  return null;
}

/** Prompts the user for a 2FA code on stdin and resolves with their answer. */
function promptTwoFactorCode(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question("Enter your 2FA code: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// =========================================================================================================
// Main
// =========================================================================================================

/**
 * Processes incoming notifications: declines group invites and marks group announcements as read.
 * Unknown notification types are logged and skipped.
 */
export async function handleNotifications(notifications: NotificationsResult): Promise<void> {
  for (const notification of notifications.data) {
    switch (notification.type) {
      case "group.invite": {
        const declineData = findResponseData(notification, "decline");
        if (declineData === null) {
          printMessage(`No reject info found for notification "${notification.id}"`);
          continue;
        }

        await VRCHAT_CLIENT.respondToNotification({
          path: { notificationId: notification.id },
          body: { data: declineData, type: "decline" },
        });
        printMessage(`Declined group invite from "${notification.data.groupName ?? "unknown"}"`);
        break;
      }

      case "group.announcement": {
        const markAsReadData = findResponseData(notification, "delete");
        if (markAsReadData === null) {
          printMessage(`No mark as read info found for notification "${notification.id}"`);
          continue;
        }

        await VRCHAT_CLIENT.respondToNotification({
          path: { notificationId: notification.id },
          body: { data: markAsReadData, type: "delete" },
        });
        printMessage(
          `Marked as read announcement "${notification.data.announcementTitle ?? "unknown"}" ` +
            `from group "${notification.data.groupName ?? "unknown"}"`,
        );
        break;
      }

      default:
        printMessage(`Unknown notification type: ${notification.type}`);
        break;
    }
  }
}

/**
 * Signs in to VRChat, reusing the persisted session if valid and falling back to a fresh login with
 * interactive 2FA otherwise. After a successful sign-in, processes any pending notifications.
 * Returns the authenticated client, or undefined if sign-in failed.
 */
export async function signIn(): Promise<VRChatExtended | undefined> {
  try {
    const { data: currentUser } = await VRCHAT_CLIENT.getCurrentUser({ throwOnError: true }).catch(
      () =>
        VRCHAT_CLIENT.login({
          username: env.VRCHAT_USERNAME,
          password: env.VRCHAT_PASSWORD,
          twoFactorCode: promptTwoFactorCode,
          throwOnError: true,
        }),
    );

    printMessage(`Signed in as ${currentUser.displayName} (${currentUser.id})`);

    const notifications = await VRCHAT_CLIENT.listNotifications();
    printMessage(`Found ${notifications.data.length} notification(s)`);

    await handleNotifications(notifications);

    return VRCHAT_CLIENT;
  } catch (error) {
    console.error("Failed to sign in to VRChat:\n\n", error);
    return undefined;
  }
}
