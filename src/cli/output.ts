export function printHelp(): void {
  console.log(`
ConfigGuard CLI

Validate environment configuration against a Zod schema.

Usage:
  configguard validate
  configguard validate --env <path>
  configguard validate --schema <path>
  configguard validate --env <path> --schema <path>

Options:
  -e, --env       Environment file (default: .env)
  -s, --schema    TypeScript schema (default: configguard.config.ts)
  -h, --help      Show help

The schema file must export a named configSchema.
Only load schema files you trust.
`);
}

export function printSuccess(): void {
  console.log("Configuration is valid.");
}

export function printErrors(
  errors: Array<{ path: string; message: string }>,
): void {
  console.error("Configuration validation failed:");

  for (const error of errors) {
    console.error(`  - ${error.path}: ${error.message}`);
  }
}
