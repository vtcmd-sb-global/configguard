import { validateConfig } from "../index.js";
import { loadSchema } from "./load-schema.js";
import { printErrors, printSuccess } from "./output.js";
import { readEnvFile } from "./read-env.js";

export async function runValidate(
  envPath: string,
  schemaPath: string,
  includeProcessEnv = false,
): Promise<number> {
  try {
    const [fileConfig, schema] = await Promise.all([
      readEnvFile(envPath),
      loadSchema(schemaPath),
    ]);

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
