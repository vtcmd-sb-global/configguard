import { z } from "zod";
import { validateConfig } from "../index.js";
import { loadSchema } from "./load-schema.js";
import {
  printErrors,
  printFailure,
  printSuccess,
  type ValidationError,
} from "./output.js";
import type { OutputFormat } from "./args.js";
import { readEnvFile } from "./read-env.js";

export async function runValidate(
  envPath: string,
  schemaPath: string,
  includeProcessEnv = false,
  strict = false,
  format: OutputFormat = "text",
): Promise<number> {
  try {
    const [fileConfig, schema] = await Promise.all([
      readEnvFile(envPath),
      loadSchema(schemaPath),
    ]);

    if (strict) {
      if (!(schema instanceof z.ZodObject)) {
        throw new Error(
          "--strict requires configSchema to be a Zod object schema.",
        );
      }

      const declaredKeys = new Set(Object.keys(schema.shape));
      const unknownKeys = Object.keys(fileConfig).filter(
        (key) => !declaredKeys.has(key),
      );

      if (unknownKeys.length > 0) {
        const errors: ValidationError[] = unknownKeys.map((key) => ({
          path: key,
          message: "Unknown environment key.",
        }));

        printErrors(errors, format);
        return 1;
      }
    }

    const config = includeProcessEnv
      ? { ...fileConfig, ...process.env }
      : fileConfig;

    const result = validateConfig(config, schema);

    if (!result.success) {
      printErrors(result.errors, format);
      return 1;
    }

    printSuccess(format);
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    printFailure(message, format);
    return 2;
  }
}
