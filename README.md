# ConfigGuard

**Validate your application configuration before deployment.**

ConfigGuard is a lightweight TypeScript utility that validates application configuration using [Zod](https://zod.dev/). It returns type-safe parsed data when configuration is valid and clear validation errors when it isn't.

## Features

- Validate configuration objects against Zod schemas.
- Parse and transform values, such as environment variables.
- Return structured validation errors with field paths.
- Written in TypeScript with generated type declarations.
- Lightweight API designed for Node.js applications.

## Requirements

- Node.js 22 or later
- Zod 4

## Installation

```bash
npm install configguard zod
```

## Quick Start

```typescript
import { z } from "zod";
import { validateConfig } from "configguard";

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  APP_NAME: z.string().min(1),
});

const result = validateConfig(
  {
    PORT: process.env.PORT ?? "3000",
    APP_NAME: process.env.APP_NAME ?? "Your Application",
  },
  configSchema,
);

if (!result.success) {
  console.error("Invalid application configuration:");

  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }

  process.exitCode = 1;
} else {
  const config = result.data;

  console.log("Configuration validated successfully.");
  console.log(`Application: ${config.APP_NAME}`);
  console.log(`Port: ${config.PORT}`);
}
```

## API Reference

### `validateConfig(input, schema)`

Validates input against a Zod schema.

**Parameters**

- `input`: The configuration value to validate.
- `schema`: A Zod schema describing the expected configuration.

**Successful result**

```typescript
{
  success: true,
  data: /* parsed configuration */
}
```

**Failed result**

```typescript
{
  success: false,
  errors: [
    {
      path: "PORT",
      message: "Invalid input"
    }
  ]
}
```

The actual error message depends on the validation failure.

## Why ConfigGuard?

Application configuration often contains values from environment variables, which arrive as strings. A missing, malformed, or out-of-range value can cause problems at runtime.

ConfigGuard provides a consistent result format so your application can validate configuration early and handle errors explicitly.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/vtcmd-sb-global/configguard.git
cd configguard
npm install
```

Run the checks:

```bash
npm run typecheck
npm test
npm run build
```

## Roadmap

Potential future improvements include:

- CLI validation for `.env` files.
- Better secret redaction in error reports.
- Configuration validation examples for popular frameworks.
- Improved diagnostics and developer experience.

## Contributing

Bug reports, feature suggestions, and contributions are welcome through GitHub Issues and Pull Requests.

## License

MIT
