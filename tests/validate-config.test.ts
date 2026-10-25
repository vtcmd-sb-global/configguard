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

    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
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
      expect(result.errors.some((error) => error.path === "PORT")).toBe(true);
    }
  });
});
