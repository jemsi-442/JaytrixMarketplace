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
  assert.equal(resolveDatabaseUrl("mariadb://user:pass@127.0.0.1:3306/ecommerce"), "mariadb://user:pass@127.0.0.1:3306/ecommerce");
});

test("production database guard requires explicit database config", () => {
  assert.equal(hasProductionDatabaseConfig({}), false);
  assert.equal(
    hasProductionDatabaseConfig({
      DB_HOST: "127.0.0.1",
      DB_NAME: "ecommerce",
      DB_USER: "root",
    }),
    true
  );
  assert.equal(
    hasProductionDatabaseConfig({
      DATABASE_URL: "mariadb://user:pass@db.example.com:3306/ecommerce",
    }),
    true
  );
});

test("template value detector catches unsafe deployment placeholders", () => {
  assert.equal(isTemplateValue("replace_with_secret"), true);
  assert.equal(isTemplateValue("<database-password>"), true);
  assert.equal(isTemplateValue("real_value"), false);
});
