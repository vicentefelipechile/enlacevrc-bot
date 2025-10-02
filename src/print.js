/**
 * @license     MIT
 * @file        print.js
 * @author      vicentefelipechile
 * @description Utility function for printing formatted messages to the console.
 */

// =================================================================================================
// PrintMessage Function
// =================================================================================================

/**
 * Prints messages to the console with a timestamp and a specific format.
 * @param  {...any} messages - The messages to print.
 * @returns {void}
 */

function PrintMessage(...messages) {
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const allMessages = messages.join(' | ');
  console.log(`[EnlaceVRC] [${currentTime}] => ${allMessages}`);
};

// =================================================================================================
// Export Statement
// =================================================================================================

module.exports = PrintMessage;