import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "dotenv";

export async function readEnvFile(
  filePath: string,
): Promise<Record<string, string>> {
  const absolutePath = resolve(process.cwd(), filePath);

  let content: string;

  try {
    content = await readFile(absolutePath, "utf8");
  } catch {
    throw new Error(`Unable to read environment file: ${filePath}`);
  }

  return parse(content);
}
