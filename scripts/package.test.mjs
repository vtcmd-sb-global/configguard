import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { validateConfig } from "@aousaja/configguard";

const schema = z.object({
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535),
});

test("public package export validates valid configuration", () => {
  const result = validateConfig(
    {
      APP_NAME: "ConfigGuard integration test",
      PORT: "3000",
    },
    schema,
  );

  assert.equal(result.success, true);

  if (!result.success) {
    assert.fail("Expected valid configuration to pass.");
  }

  assert.deepEqual(result.data, {
    APP_NAME: "ConfigGuard integration test",
    PORT: 3000,
  });
});

test("public package export reports invalid configuration", () => {
  const result = validateConfig(
    {
      APP_NAME: "",
      PORT: "not-a-number",
    },
    schema,
  );

  assert.equal(result.success, false);

  if (result.success) {
    assert.fail("Expected invalid configuration to fail.");
  }

  assert.deepEqual(
    result.errors.map((error) => error.path),
    ["APP_NAME", "PORT"],
  );

  assert.ok(result.errors.every((error) => error.message.length > 0));
});
