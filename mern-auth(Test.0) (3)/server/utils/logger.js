const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create logs directory:', err.message);
  }
}

const logFile = path.join(logDir, 'security-events.log');

/**
 * Format and write security and business events
 */
const logEvent = (eventType, details = {}, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    eventType,
    ...details,
  };

  const line = JSON.stringify(entry);

  // Output to console with styled emoji for dev observability
  const badge = level === 'ERROR' ? '🚨' : level === 'WARN' ? '⚠️' : '🛡️';
  console.log(`${badge} [${timestamp}] [${level}] [${eventType}]:`, details);

  // Append to persistent log file
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch (err) {
    console.error('Failed to write to security log file:', err.message);
  }
};

module.exports = {
  logEvent,
  info: (eventType, details) => logEvent(eventType, details, 'INFO'),
  warn: (eventType, details) => logEvent(eventType, details, 'WARN'),
  error: (eventType, details) => logEvent(eventType, details, 'ERROR'),
};
