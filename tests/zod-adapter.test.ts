import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodAdapter } from "../src/adapters/zod-adapter.js";

describe("ZodAdapter", () => {
  it("returns validated data when input is valid", () => {
    const adapter = new ZodAdapter(
      z.object({
        PORT: z.coerce.number().int().positive(),
        NODE_ENV: z.enum(["development", "production", "test"]),
      }),
    );

    const result = adapter.validate({
      PORT: "3000",
      NODE_ENV: "development",
    });

    expect(result).toEqual({
      success: true,
      data: {
        PORT: 3000,
        NODE_ENV: "development",
      },
    });
  });

  it("returns normalized errors when input is invalid", () => {
    const adapter = new ZodAdapter(
      z.object({
        PORT: z.number().positive(),
      }),
    );

    const result = adapter.validate({
      PORT: -1,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        path: "PORT",
        message: expect.any(String),
      });
    }
  });

  it("uses $ for a root-level validation error", () => {
    const adapter = new ZodAdapter(z.string());

    const result = adapter.validate(123);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors[0]?.path).toBe("$");
    }
  });
});
