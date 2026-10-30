#!/usr/bin/env node

import { parseArgs } from "./args.js";
import { printHelp } from "./output.js";
import { runValidate } from "./validate-command.js";

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      printHelp();
      return;
    }

    process.exitCode = await runValidate(
      options.envPath,
      options.schemaPath,
      options.includeProcessEnv,
      options.strict,
      options.format,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    console.error(`ConfigGuard: ${message}`);
    console.error("Run configguard --help for usage.");
    process.exitCode = 2;
  }
}

await main();
