import "./env.js";
import { Sequelize } from "sequelize";

const isProduction = process.env.NODE_ENV === "production";
const shouldSync = !isProduction && process.env.DB_SYNC === "true";
const shouldAlter =
  shouldSync &&
  (process.env.DB_SYNC_ALTER === "true" ||
    (!isProduction && process.env.DB_SYNC_ALTER !== "false"));

export const isTemplateValue = (value = "") =>
  !value || value.includes("${{") || value.startsWith("replace_with_") || value.includes("<");

export const resolveDatabaseUrl = (...candidates) => {
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (isTemplateValue(value)) continue;

    try {
      const parsed = new URL(value);
      if (["postgres:", "postgresql:"].includes(parsed.protocol)) {
        return value;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

export const hasProductionDatabaseConfig = (env = process.env) => {
  if (resolveDatabaseUrl(env.DATABASE_URL, env.POSTGRES_URL)) {
    return true;
  }

  return ["DB_HOST", "DB_NAME", "DB_USER"].every((key) => !isTemplateValue(env[key]));
};

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL, process.env.POSTGRES_URL);
const dialect = process.env.DB_DIALECT || "postgres";
const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";
const pool = {
  max: Number(process.env.DB_POOL_MAX || 10),
  min: Number(process.env.DB_POOL_MIN || 0),
  acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 30000),
  idle: Number(process.env.DB_POOL_IDLE_MS || 10000),
};
const dialectOptions = {
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  ...(sslEnabled
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false",
        },
      }
    : {}),
};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect,
      logging: false,
      dialectOptions,
      pool,
    })
  : new Sequelize(
      process.env.DB_NAME || "marketplace",
      process.env.DB_USER || "jaytrix",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 5432),
        dialect,
        logging: false,
        dialectOptions,
        pool,
      }
    );

export const connectDB = async () => {
  if (isProduction && !hasProductionDatabaseConfig()) {
    throw new Error("Production database config is missing. Set DATABASE_URL or DB_HOST, DB_NAME, and DB_USER.");
  }

  await sequelize.authenticate();

  if (!shouldSync) {
    return;
  }

  await sequelize.sync({ alter: shouldAlter });
};

export default sequelize;
