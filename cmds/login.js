/**
 * Variables
 */

const { VRCHAT_APPLICATION_NAME, VRCHAT_EMAIL_CONTACT, VRCHAT_PASSWORD, VRCHAT_USERNAME } = require('../src/env');
const PrintMessage = require("../src/print");
const { createInterface } = require('readline');
const { KeyvFile } = require('keyv-file');
const { VRChat } = require('vrchat');
const { exit } = require('process');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const Prompt = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const COOKIE_FILE = 'data.json';
const VRCHAT_CLIENT = new VRChat({
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


const SignIn = async () => {
  try {

    const { data: currentUser } = await VRCHAT_CLIENT
      .getCurrentUser({ throwOnError: false })
      .catch(() => {
        // if (!(error instanceof VRChatError) || error.statusCode !== 401) throw error;

        return VRCHAT_CLIENT.login({
          username: VRCHAT_USERNAME,
          password: VRCHAT_PASSWORD,
          twoFactorCode: async () => { return await Prompt('Enter your 2FA code: '); },
          throwOnError: true,
        });
      });

    PrintMessage(`Signed in as ${currentUser.displayName} (${currentUser.id})`);

    alreadySignIn = true;

    return VRCHAT_CLIENT;
  } catch (error) {
    PrintMessage('This is your first time running the bot, run again this command to sign in.');
    PrintMessage(`Error during sign-in: ${error.message}`);
    exit(1);
  }
};

(async () => {
  try {
    const vr = await SignIn();
    if (vr) {
      PrintMessage('VRChat client initialized successfully.');
      exit(0);
    }

  } catch (error) {
    console.error('Error during VRChat sign-in:', error);
  }
})();