import assert from "node:assert/strict";
import test from "node:test";

import { isUnsafeConfiguredPassword, requireConfiguredPassword } from "../utils/accountSecurity.js";

test("account password guard rejects missing, weak, placeholder, and common passwords", () => {
  assert.equal(isUnsafeConfiguredPassword(""), true);
  assert.equal(isUnsafeConfiguredPassword("short"), true);
  assert.equal(isUnsafeConfiguredPassword("replace_with_admin_password"), true);
  assert.equal(isUnsafeConfiguredPassword("<secret>"), true);
  assert.equal(isUnsafeConfiguredPassword("Jay442tx"), true);
  assert.equal(isUnsafeConfiguredPassword("Password123!"), true);
  assert.equal(isUnsafeConfiguredPassword("Strong-Marketplace-Password-2026!"), false);
});

test("requireConfiguredPassword returns safe configured passwords", () => {
  const previousPassword = process.env.TEST_ACCOUNT_PASSWORD;
  process.env.TEST_ACCOUNT_PASSWORD = "Strong-Marketplace-Password-2026!";

  try {
    assert.equal(
      requireConfiguredPassword("TEST_ACCOUNT_PASSWORD", "running the password guard test"),
      "Strong-Marketplace-Password-2026!"
    );
  } finally {
    if (previousPassword === undefined) {
      delete process.env.TEST_ACCOUNT_PASSWORD;
    } else {
      process.env.TEST_ACCOUNT_PASSWORD = previousPassword;
    }
  }
});

test("requireConfiguredPassword throws for unsafe configured passwords", () => {
  const previousPassword = process.env.TEST_ACCOUNT_PASSWORD;
  process.env.TEST_ACCOUNT_PASSWORD = "Password123!";

  try {
    assert.throws(
      () => requireConfiguredPassword("TEST_ACCOUNT_PASSWORD", "running the password guard test"),
      /placeholder or commonly used password/
    );
  } finally {
    if (previousPassword === undefined) {
      delete process.env.TEST_ACCOUNT_PASSWORD;
    } else {
      process.env.TEST_ACCOUNT_PASSWORD = previousPassword;
    }
  }
});
