import { consoleLogger, errorLogger, logger } from "./app/utilities/logger";
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config/config";

process.on("uncaughtException", (error) => {
  errorLogger.error("Uncaught exception; shutting down.", error);
  process.exit(1);
});

let server: Server;
/**
 * The `bootstrap` function connects to a database, starts a server, seeds a super admin, and handles
 * unhandled rejections.
 */
const bootstrap = async () => {
  try {
    if (!config.DBUrl) {
      throw new Error(
        "Set MONGODB_URI or DB_URL in the server runtime environment."
      );
    }
    consoleLogger.info("Connecting to MongoDB...");
    await mongoose.connect(config.DBUrl, { serverSelectionTimeoutMS: 10000 });
    consoleLogger.info(`✅ The server is running on ${config.env} mode`);
    logger.info(`✅ Database is connected successfully.`);
    const port = Number(config.port || 5000);
    server = app.listen(port, "0.0.0.0", () => {
      logger.info(`✅ The server is running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    errorLogger.error("Server startup failed.", error);
    // Cron jobs keep the event loop alive even when the HTTP server never starts.
    process.exit(1);
  }

  process.on("unhandledRejection", (error) => {
    errorLogger.error(
      `❌ Unhandled rejection happened. Exiting the process.`,
      error
    );
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
};

bootstrap();
