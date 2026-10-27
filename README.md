# ConfigGuard 🛡️

**Validate your application configuration before deployment.**

ConfigGuard is a TypeScript configuration-validation toolkit that helps developers catch invalid configuration early. It provides a consistent validation interface, adapters for popular validation libraries, and a command-line interface for validating environment files.

Instead of discovering missing or invalid configuration after your application starts, validate it before running or deploying your application.

## ✨ Features

- **Type-safe validation:** Work with typed validation results in TypeScript.
- **Zod adapter:** Integrate Zod schemas through `ZodAdapter`.
- **Ajv adapter:** Integrate JSON Schema validation through `AjvAdapter`.
- **Consistent results:** Receive a predictable success or failure structure.
- **Readable errors:** Get property paths and validation messages.
- **CLI validation:** Validate environment configuration from the command line.
- **Security-conscious errors:** Validation output reports paths and messages rather than printing configuration values.
- **Lightweight integration:** Use the adapters with your existing validation schemas.

## 📦 Installation

Install ConfigGuard in your project:

```bash
npm install @aousaja/configguard
```

ConfigGuard requires **Node.js 22 or later**.

For Zod-based validation, Zod is included as a package dependency. If you use the Ajv adapter, install Ajv as well:

```bash
npm install ajv
```

## 🚀 Quick Start with Zod

Create a schema and validate your configuration:

```ts
import { z } from "zod";
import { validateConfig } from "@aousaja/configguard";

const configSchema = z.object({
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535),
});

const config = {
  APP_NAME: "My Application",
  PORT: "3000",
};

const result = validateConfig(config, configSchema);

if (result.success) {
  console.log("Configuration is valid!");
  console.log(result.data);
} else {
  console.error("Configuration validation failed:");

  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }
}
```

The example uses `z.coerce.number()` to convert the string `"3000"` into the number `3000`.

### Understanding the result

When validation succeeds, ConfigGuard returns the validated data:

```ts
{
  success: true,
  data: {
    APP_NAME: "My Application",
    PORT: 3000
  }
}
```

When validation fails, it returns structured errors:

```ts
{
  success: false,
  errors: [
    {
      path: "PORT",
      message: "..."
    }
  ]
}
```

The exact error messages depend on the schema and validation library.

## 🔌 Using the Zod Adapter

Use `ZodAdapter` directly when you want to work with the common validator interface:

```ts
import { z } from "zod";
import { ZodAdapter } from "@aousaja/configguard";

const schema = z.object({
  APP_NAME: z.string(),
  PORT: z.number().int(),
});

const validator = new ZodAdapter(schema);

const result = validator.validate({
  APP_NAME: "My Application",
  PORT: 3000,
});

console.log(result);
```

`validateConfig()` is a convenient Zod-based function. `ZodAdapter` exposes the same validation behavior through the `ConfigValidator` interface.

## 🔌 Using the Ajv Adapter

ConfigGuard also supports Ajv for JSON Schema validation.

Install Ajv:

```bash
npm install ajv
```

Then create a JSON Schema and pass Ajv's compiled validator to `AjvAdapter`:

```ts
import Ajv, { type JSONSchemaType } from "ajv";
import { AjvAdapter } from "@aousaja/configguard";

interface AppConfig {
  APP_NAME: string;
  PORT: number;
}

const schema: JSONSchemaType<AppConfig> = {
  type: "object",
  properties: {
    APP_NAME: { type: "string" },
    PORT: { type: "integer", minimum: 1, maximum: 65535 },
  },
  required: ["APP_NAME", "PORT"],
  additionalProperties: false,
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

const validator = new AjvAdapter(validate);

const result = validator.validate({
  APP_NAME: "My Application",
  PORT: 3000,
});

if (result.success) {
  console.log("Configuration is valid!");
  console.log(result.data);
} else {
  console.error(result.errors);
}
```

Both adapters return the same `ConfigValidationResult` structure, allowing application code to handle validation results consistently.

## 🖥️ Command-Line Interface

ConfigGuard includes a CLI for validating environment files against a Zod schema.

### 1. Create an environment file

For example, create `.env`:

```dotenv
APP_NAME=My Application
PORT=3000
```

### 2. Create the schema file

Create `configguard.config.ts` in your project's root directory:

```ts
import { z } from "zod";

export const configSchema = z.object({
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535),
});
```

The CLI expects a **named export called `configSchema`**.

### 3. Run the CLI

If ConfigGuard is installed in your project, run:

```bash
npx configguard --help
npx configguard validate
```

Validate a specific environment file:

```bash
npx configguard validate --env .env.production
```

Specify a different schema file:

```bash
npx configguard validate --schema config/schema.ts
```

Specify both paths:

```bash
npx configguard validate --env .env.production --schema config/schema.ts
```

For a one-off invocation without adding ConfigGuard to your project's dependencies, you can use:

```bash
npm exec --yes --package=@aousaja/configguard -- configguard --help
```

### CLI options

| Option                  | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `-e, --env`             | Environment file path. Defaults to `.env`.                                  |
| `-s, --schema`          | TypeScript schema path. Defaults to `configguard.config.ts`.                |
| `--include-process-env` | Include runtime environment variables; runtime values override file values. |
| `-h, --help`            | Display CLI help.                                                           |

Paths are resolved relative to the current working directory unless absolute paths are supplied.

By default, the CLI validates values read from the specified environment file only. It does **not** automatically merge values from `process.env`.

To include runtime environment variables, use the `--include-process-env` flag:

```bash
npx configguard validate --include-process-env
```

You can combine this flag with custom environment-file and schema paths:

```bash
npx configguard validate --env .env.production --schema config/schema.ts --include-process-env
```

When enabled, runtime environment variables override values with the same names in the environment file. This is useful when validating configuration in CI/CD pipelines or deployment environments.

### Exit codes

| Exit code | Meaning                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- |
| `0`       | Configuration validation succeeded.                                                         |
| `1`       | Configuration validation failed.                                                            |
| `2`       | An operational or command-line error occurred, such as a missing file or invalid arguments. |

### CLI security note

The CLI loads and executes the specified TypeScript schema file. **Only run it with schema files you trust.**

Avoid committing secrets to version control. Protect your environment files and use appropriate secret-management practices in CI/CD pipelines.

## 🧩 API Reference

### `validateConfig(input, schema)`

Validates an input value using a Zod schema.

- `input`: The value to validate.
- `schema`: A Zod schema.
- Returns: A `ConfigValidationResult<T>`.

### `ZodAdapter<T>`

Wraps a Zod schema and implements the shared `ConfigValidator<T>` interface.

### `AjvAdapter<T>`

Wraps an Ajv compiled validator and implements the shared `ConfigValidator<T>` interface.

### `ConfigValidator<T>`

The common interface implemented by the adapters:

```ts
interface ConfigValidator<T> {
  validate(input: unknown): ConfigValidationResult<T>;
}
```

### `ConfigValidationResult<T>`

A discriminated union representing success or failure:

```ts
type ConfigValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ConfigValidationError[];
    };
```

### `ConfigValidationError`

Each validation error contains:

```ts
interface ConfigValidationError {
  path: string;
  message: string;
}
```

## 🛠️ Development

To work on ConfigGuard locally:

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
npm run test:package
npm run test:cli
```

Run the complete pre-publication verification:

```bash
npm run prepublishOnly
```

This script runs the type check, unit tests, build, package integration tests, and CLI tests.

## 🗺️ Roadmap

Potential future improvements include:

- Additional validator adapters.
- More detailed error-formatting options.
- Expanded CLI configuration options.
- Improved support for common deployment and CI/CD workflows.

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome.

Please open an issue to discuss a significant change before submitting a pull request.

## 📄 License

ConfigGuard is released under the [MIT License](https://github.com/vtcmd-sb-global/configguard/blob/main/LICENSE).

## 🔗 Links

- **npm:** https://www.npmjs.com/package/@aousaja/configguard
- **GitHub:** https://github.com/vtcmd-sb-global/configguard
- **Issues:** https://github.com/vtcmd-sb-global/configguard/issues

---

Built to make application configuration validation more consistent, predictable, and developer-friendly.
