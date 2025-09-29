module.exports = function PrintMessage(...messages) {
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const allMessages = messages.join(' | ');
  console.log(`[EnlaceVRC] [${currentTime}] => ${allMessages}`);
};