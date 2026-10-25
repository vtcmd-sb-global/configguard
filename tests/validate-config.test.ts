
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateConfig } from "../src/validate-config.js";

describe("validateConfig", () => {
  const schema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535),
    APP_NAME: z.string().min(1),
  });

  it("accepts valid configuration", () => {
    const result = validateConfig(
      {
        PORT: "3000",
        APP_NAME: "ConfigGuard",
      },
      schema,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.APP_NAME).toBe("ConfigGuard");
    }
  });

  it("rejects invalid configuration", () => {
    const result = validateConfig(
      {
        PORT: "invalid",
        APP_NAME: "",
      },
      schema,
    );

    expect(result.success).toBe(false);
  });

  it("reports the path of an invalid value", () => {
    const result = validateConfig(
      {
        PORT: "invalid",
        APP_NAME: "ConfigGuard",
      },
      schema,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.errors.some((error) => error.path === "PORT"),
      ).toBe(true);
    }
  });

  it("rejects missing required fields", () => {
    const result = validateConfig({}, schema);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.errors.some((error) => error.path === "PORT"),
      ).toBe(true);

      expect(
        result.errors.some((error) => error.path === "APP_NAME"),
      ).toBe(true);
    }
  });

  it("returns multiple validation errors", () => {
    const result = validateConfig(
      {
        PORT: "invalid",
        APP_NAME: "",
      },
      schema,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("reports nested field paths", () => {
    const nestedSchema = z.object({
      DATABASE: z.object({
        HOST: z.string().min(1),
      }),
    });

    const result = validateConfig(
      {
        DATABASE: {
          HOST: "",
        },
      },
      nestedSchema,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.errors.some(
          (error) => error.path === "DATABASE.HOST",
        ),
      ).toBe(true);
    }
  });

  it("reports array index paths", () => {
    const serverSchema = z.object({
      SERVERS: z.array(
        z.object({
          PORT: z.number(),
        }),
      ),
    });

    const result = validateConfig(
      {
        SERVERS: [
          { PORT: 8080 },
          { PORT: "invalid" },
        ],
      },
      serverSchema,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.errors.some(
          (error) => error.path === "SERVERS.1.PORT",
        ),
      ).toBe(true);
    }
  });

  it("applies schema defaults", () => {
    const defaultSchema = z.object({
      PORT: z.coerce.number().default(3000),
    });

    const result = validateConfig({}, defaultSchema);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.PORT).toBe(3000);
    }
  });

  it("accepts optional fields when they are omitted", () => {
    const optionalSchema = z.object({
      APP_NAME: z.string().optional(),
    });

    const result = validateConfig({}, optionalSchema);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.APP_NAME).toBeUndefined();
    }
  });

  it("preserves the schema's unknown-key behavior", () => {
    const strictShapeSchema = z.object({
      APP_NAME: z.string(),
    });

    const result = validateConfig(
      {
        APP_NAME: "ConfigGuard",
        EXTRA_FIELD: "ignored by default",
      },
      strictShapeSchema,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.APP_NAME).toBe("ConfigGuard");
      expect(result.data).not.toHaveProperty("EXTRA_FIELD");
    }
  });
});
