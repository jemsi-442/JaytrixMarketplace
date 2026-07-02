import assert from "node:assert/strict";
import test from "node:test";

import {
  hasProductionDatabaseConfig,
  isTemplateValue,
  resolveDatabaseUrl,
} from "../config/db.js";

test("database config ignores placeholder URLs", () => {
  assert.equal(resolveDatabaseUrl("replace_with_database_url"), null);
  assert.equal(resolveDatabaseUrl("${{DATABASE_URL}}"), null);
  assert.equal(resolveDatabaseUrl("sqlite://local.db"), null);
  assert.equal(resolveDatabaseUrl("postgres://user:pass@127.0.0.1:5432/marketplace"), "postgres://user:pass@127.0.0.1:5432/marketplace");
});

test("production database guard requires explicit database config", () => {
  assert.equal(hasProductionDatabaseConfig({}), false);
  assert.equal(
    hasProductionDatabaseConfig({
      DB_HOST: "127.0.0.1",
      DB_NAME: "marketplace",
      DB_USER: "jaytrix",
    }),
    true
  );
  assert.equal(
    hasProductionDatabaseConfig({
      DATABASE_URL: "postgres://user:pass@db.example.com:5432/marketplace",
    }),
    true
  );
});

test("template value detector catches unsafe deployment placeholders", () => {
  assert.equal(isTemplateValue("replace_with_secret"), true);
  assert.equal(isTemplateValue("<database-password>"), true);
  assert.equal(isTemplateValue("real_value"), false);
});
