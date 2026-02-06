const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist (for local dev)
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Create a stream for Morgan logging
logger.stream = {
  write: function (message, encoding) {
    logger.info(message.trim());
  },
};

// Utility function to log booking operations
const logBookingOperation = (operation, bookingId, userId, details = {}) => {
  logger.info({
    operation,
    bookingId,
    userId,
    timestamp: new Date().toISOString(),
    details,
  });
};

// Utility function to log booking errors
const logBookingError = (operation, bookingId, userId, error, details = {}) => {
  logger.error({
    operation,
    bookingId,
    userId,
    error: error.message || error,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    details,
  });
};

module.exports = {
  logger,
  logBookingOperation,
  logBookingError,
};
