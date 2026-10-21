import path from "path";
import { createLogger, format, transport, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "../config/config";

const { combine, timestamp, printf, colorize, errors } = format;

// log format
const myFormat = printf(({ level, message, timestamp, stack }) => {
  const date = new Date(timestamp as string | number | Date);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  return `{${date.toDateString()} ${hour}:${minute}:${second}:${milliseconds}} ${level}: ${stack || message}`;
});

/**
 * Helper to create a Winston logger with standard rotation settings.
 * @param category - Main folder (e.g., 'general', 'modules')
 * @param subfolder - Subfolder for specific module/context
 * @param fileNamePrefix - Prefix for the log file
 * @param level - Logging level
 */
const createContextualLogger = (
  category: string,
  subfolder: string,
  fileNamePrefix: string,
  level: string = "info"
) => {
  const activeTransports: transport[] = [
    new transports.Console({
      stderrLevels: ["error"],
      format:
        config.env === "development" ? combine(colorize(), myFormat) : myFormat,
    }),
  ];

  if (config.env !== "development") {
    // Retain rotating production files alongside Docker stdout/stderr logs.
    activeTransports.push(
      new DailyRotateFile({
        filename: path.join(
          process.cwd(),
          "logs",
          category,
          subfolder,
          `ec-%DATE%-${fileNamePrefix}.log`
        ),
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
      })
    );
  }

  return createLogger({
    level,
    format: combine(errors({ stack: true }), timestamp(), myFormat),
    transports: activeTransports,
  });
};

// General Loggers
const logger = createContextualLogger("general", "success", "success", "info");
const errorLogger = createContextualLogger(
  "general",
  "error",
  "error",
  "error"
);
const consoleLogger = createContextualLogger(
  "general",
  "console",
  "console",
  "info"
);
const requestLogger = createContextualLogger(
  "general",
  "requests",
  "request",
  "info"
);

// Module/Specific Loggers
const courierStatusUpdateError = createContextualLogger(
  "modules",
  "courier",
  "error",
  "error"
);
const lowStockWarningError = createContextualLogger(
  "modules",
  "lowStock",
  "error",
  "error"
);

export {
  consoleLogger,
  courierStatusUpdateError,
  errorLogger,
  logger,
  lowStockWarningError,
  requestLogger,
};
