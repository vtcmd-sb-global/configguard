export type OutputFormat = "text" | "json";

export interface CliOptions {
  command: string;
  envPath: string;
  schemaPath: string;
  help: boolean;
  includeProcessEnv: boolean;
  strict: boolean;
  format: OutputFormat;
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    command: "",
    envPath: ".env",
    schemaPath: "configguard.config.ts",
    help: false,
    includeProcessEnv: false,
    strict: false,
    format: "text",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--include-process-env") {
      options.includeProcessEnv = true;
      continue;
    }

    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg === "--format") {
      const value = args[++i];

      if (value !== "text" && value !== "json") {
        throw new Error(`${arg} requires either "text" or "json".`);
      }

      options.format = value;
      continue;
    }

    if (arg === "--env" || arg === "-e") {
      const value = args[++i];

      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a file path.`);
      }

      options.envPath = value;
      continue;
    }

    if (arg === "--schema" || arg === "-s") {
      const value = args[++i];

      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a file path.`);
      }

      options.schemaPath = value;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.command) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    options.command = arg;
  }

  if (!options.help && options.command !== "validate") {
    throw new Error("Unknown or missing command. Use --help for usage.");
  }

  return options;
}
