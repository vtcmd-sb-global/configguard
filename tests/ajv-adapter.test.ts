import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { AjvAdapter } from "../src/adapters/ajv-adapter.js";

describe("AjvAdapter", () => {
  it("returns validated data when input is valid", () => {
    const ajv = new Ajv();
    const validate = ajv.compile({
      type: "object",
      properties: {
        PORT: { type: "integer", minimum: 1 },
      },
      required: ["PORT"],
      additionalProperties: false,
    });

    const adapter = new AjvAdapter<{ PORT: number }>(validate);
    const result = adapter.validate({ PORT: 3000 });

    expect(result).toEqual({
      success: true,
      data: { PORT: 3000 },
    });
  });

  it("returns normalized errors when input is invalid", () => {
    const ajv = new Ajv();
    const validate = ajv.compile({
      type: "object",
      properties: {
        PORT: { type: "integer", minimum: 1 },
      },
      required: ["PORT"],
    });

    const adapter = new AjvAdapter<{ PORT: number }>(validate);
    const result = adapter.validate({ PORT: -1 });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatchObject({
        path: "PORT",
        message: expect.any(String),
      });
    }
  });

  it("converts nested JSON Pointer paths to ConfigGuard paths", () => {
    const ajv = new Ajv();
    const validate = ajv.compile({
      type: "object",
      properties: {
        database: {
          type: "object",
          properties: {
            port: { type: "integer", minimum: 1 },
          },
          required: ["port"],
        },
      },
      required: ["database"],
    });

    const adapter = new AjvAdapter<{
      database: { port: number };
    }>(validate);

    const result = adapter.validate({
      database: { port: -1 },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors[0]?.path).toBe("database.port");
    }
  });

it("includes a missing property in the error path", () => {
  const ajv = new Ajv();
  const validate = ajv.compile({
    type: "object",
    properties: {
      PORT: { type: "integer" },
    },
    required: ["PORT"],
  });

  const adapter = new AjvAdapter<{ PORT: number }>(validate);
  const result = adapter.validate({});

  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.errors[0]?.path).toBe("PORT");
  }
});

it("includes an unexpected property in the error path", () => {
  const ajv = new Ajv();
  const validate = ajv.compile({
    type: "object",
    properties: {
      PORT: { type: "integer" },
    },
    additionalProperties: false,
  });

  const adapter = new AjvAdapter<{ PORT: number }>(validate);
  const result = adapter.validate({ PORT: 3000, SECRET: "hidden" });

  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.errors[0]?.path).toBe("SECRET");
  }
});
});
