import { z } from "zod";
import { validateConfig } from "../index.js";
import { loadSchema } from "./load-schema.js";
import { printErrors, printSuccess } from "./output.js";
import { readEnvFile } from "./read-env.js";

export async function runValidate(
  envPath: string,
  schemaPath: string,
  includeProcessEnv = false,
  strict = false,
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
        console.error(
          `ConfigGuard: Unknown environment keys: ${unknownKeys.join(", ")}`,
        );
        return 1;
      }
    }

    const config = includeProcessEnv
      ? { ...fileConfig, ...process.env }
      : fileConfig;

    const result = validateConfig(config, schema);

    if (!result.success) {
      printErrors(result.errors);
      return 1;
    }

    printSuccess();
    return 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    console.error(`ConfigGuard: ${message}`);
    return 2;
  }
}
