import type { ZodType } from "zod";
import { ZodAdapter } from "./adapters/zod-adapter.js";
import type { ConfigValidationResult } from "./types.js";

export type { ConfigValidationResult } from "./types.js";

export function validateConfig<T>(
  input: unknown,
  schema: ZodType<T>,
): ConfigValidationResult<T> {
  return new ZodAdapter(schema).validate(input);
}
