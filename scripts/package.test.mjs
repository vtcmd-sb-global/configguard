import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import Ajv from "ajv";
import { validateConfig, ZodAdapter, AjvAdapter } from "@aousaja/configguard";

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

test("public ZodAdapter validates and transforms configuration", () => {
  const adapter = new ZodAdapter(schema);

  const result = adapter.validate({
    APP_NAME: "ConfigGuard adapter test",
    PORT: "8080",
  });

  assert.equal(result.success, true);

  if (!result.success) {
    assert.fail("Expected adapter validation to pass.");
  }

  assert.deepEqual(result.data, {
    APP_NAME: "ConfigGuard adapter test",
    PORT: 8080,
  });
});

test("public ZodAdapter returns normalized validation errors", () => {
  const adapter = new ZodAdapter(schema);

  const result = adapter.validate({
    APP_NAME: "",
    PORT: "invalid",
  });

  assert.equal(result.success, false);

  if (result.success) {
    assert.fail("Expected adapter validation to fail.");
  }

  assert.deepEqual(
    result.errors.map((error) => error.path),
    ["APP_NAME", "PORT"],
  );

  assert.ok(result.errors.every((error) => error.message.length > 0));
});

test("public AjvAdapter validates valid configuration", () => {

  const ajv = new Ajv();
  const validate = ajv.compile({
    type: "object",
    properties: {
      PORT: { type: "integer", minimum: 1 },
    },
    required: ["PORT"],
  });

  const adapter = new AjvAdapter(validate);
  const result = adapter.validate({ PORT: 3000 });

  assert.deepEqual(result, {
    success: true,
    data: { PORT: 3000 },
  });
});

test("public AjvAdapter returns normalized validation errors", () => {

  const ajv = new Ajv();
  const validate = ajv.compile({
    type: "object",
    properties: {
      PORT: { type: "integer", minimum: 1 },
    },
    required: ["PORT"],
  });

  const adapter = new AjvAdapter(validate);
  const result = adapter.validate({ PORT: -1 });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(result.errors.length > 0);
    assert.equal(result.errors[0].path, "PORT");
    assert.equal(typeof result.errors[0].message, "string");
  }
});
