import "../config/env.js";
import sequelize from "../config/db.js";
import { runMigrations } from "../utils/migrations.js";

const run = async () => {
  try {
    await sequelize.authenticate();
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error("Migration run failed:", error.message);
    process.exit(1);
  }
};

run();
