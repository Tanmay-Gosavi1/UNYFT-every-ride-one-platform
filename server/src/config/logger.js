/**
 * @module config/logger
 * @description Structured logging using Winston.
 * Outputs JSON in production for log aggregation tools,
 * and colorized human-readable format in development.
 *
 * Log levels follow RFC 5424 (syslog):
 *   error > warn > info > http > verbose > debug > silly
 *
 * @example
 *   const logger = require('./config/logger');
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('Request failed', { error: err.message, statusCode: 500 });
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom format for development: colorized, human-readable.
 * Includes timestamp, level, message, and any additional metadata.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} [${level}]: ${message}${stackStr}${metaStr}`;
  }),
);

/**
 * Production format: structured JSON for log aggregation
 * (e.g., CloudWatch, Datadog, ELK stack).
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

/**
 * Determine log level based on environment.
 * - production: 'info' (skip debug/verbose)
 * - development: 'debug' (show everything)
 * - test: 'silent' (suppress during tests)
 */
function getLogLevel() {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test') return 'silent';
  if (env === 'production') return 'info';
  return 'debug';
}

const logger = winston.createLogger({
  level: getLogLevel(),
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'ride-compare-api' },
  transports: [
    new winston.transports.Console(),
  ],
  // Don't exit on uncaught errors — let the process manager decide
  exitOnError: false,
});

/**
 * Stream object for Morgan HTTP request logging.
 * Morgan writes to this stream, which feeds into Winston.
 *
 * @example
 *   app.use(morgan('combined', { stream: logger.stream }));
 */
logger.stream = {
  write: (message) => {
    // Morgan adds a newline, trim it
    logger.http(message.trim());
  },
};

module.exports = logger;
