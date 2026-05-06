/**
 * Minimal structured logger. Emits one JSON object per line in production
 * (so logs ship cleanly to a log aggregator), and a friendlier multi-line
 * format in development.
 *
 * Usage:
 *   import { logger } from "~/lib/logger";
 *   logger.info("login.success", { userId: u.id });
 *   logger.error("login.failure", { username }, err);
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function emit(
  level: LogLevel,
  event: string,
  context: Record<string, unknown> = {},
  error?: unknown,
) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error !== undefined) {
    entry.error = error;
  }

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (isProd) console.log(line);
  else console.log(`[${level}] ${event}`, context, error ?? "");
}

export const logger = {
  debug: (event: string, ctx?: Record<string, unknown>) => emit("debug", event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => emit("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>, err?: unknown) =>
    emit("error", event, ctx, err),
};
