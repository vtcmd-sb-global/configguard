export { validateConfig } from "./validate-config.js";
export { ZodAdapter } from "./adapters/zod-adapter.js";
export { AjvAdapter } from "./adapters/ajv-adapter.js";

export type {
  ConfigValidationError,
  ConfigValidationResult,
  ConfigValidator,
} from "./types.js";
