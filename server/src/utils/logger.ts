import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Helper to format date in the server's local timezone: "YYYY-MM-DD HH:mm:ss ±HH:mm"
export function formatLocalTimestamp(date: Date = new Date()): string {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  // Timezone offset calculation (e.g. +05:00, -07:00)
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offsetMins = String(absOffset % 60).padStart(2, '0');
  const timezoneStr = `${sign}${offsetHours}:${offsetMins}`;

  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss} ${timezoneStr}`;
}

// Log format: "2026-08-31 15:37:30 +05:00 info: <message>"
const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const logMessage = stack || message;
  return `${timestamp} ${level}: ${logMessage}${metaString}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: () => formatLocalTimestamp(new Date()),
    }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: false }),
        timestamp({
          format: () => formatLocalTimestamp(new Date()),
        }),
        customFormat
      ),
    }),
  ],
});
