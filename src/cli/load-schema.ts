import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";
import type { ZodType } from "zod";

export async function loadSchema(filePath: string): Promise<ZodType<unknown>> {
  const absolutePath = resolve(process.cwd(), filePath);
  const schemaUrl = pathToFileURL(absolutePath).href;

  let loaded: Record<string, unknown>;

  try {
    loaded = await tsImport(schemaUrl, import.meta.url);
  } catch {
    throw new Error(
      `Unable to load schema file: ${filePath}. Check that it exists and has no import or syntax errors.`,
    );
  }

  const schema = loaded.configSchema;

  if (
    typeof schema !== "object" ||
    schema === null ||
    !("safeParse" in schema) ||
    typeof schema.safeParse !== "function"
  ) {
    throw new Error(
      'Schema file must export a Zod schema named "configSchema".',
    );
  }

  return schema as ZodType<unknown>;
}
