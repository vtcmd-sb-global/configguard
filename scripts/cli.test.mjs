import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const cliPath = resolve(projectRoot, "dist/cli/index.js");

async function createFixture() {
  // Keep the temporary schema under the project so it can resolve
  // dependencies such as Zod from the project's node_modules.
  const directory = await mkdtemp(join(projectRoot, ".configguard-test-"));

  await writeFile(
    join(directory, "configguard.config.ts"),
    `
import { z } from "zod";

export const configSchema = z.object({
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
});
`,
    "utf8",
  );

  return directory;
}

function runCli(directory, args, envOverrides = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: directory,
    encoding: "utf8",
    timeout: 15_000,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

test("CLI displays help successfully", () => {
  const result = runCli(projectRoot, ["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /ConfigGuard CLI/);
  assert.match(result.stdout, /--schema/);
});

test("CLI accepts valid configuration", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI rejects invalid configuration without printing secrets", async () => {
  const directory = await createFixture();
  const secret = "test-secret-do-not-print";

  try {
    await writeFile(
      join(directory, ".env"),
      [
        `APP_NAME=${secret}`,
        "PORT=not-a-number",
        "DATABASE_URL=",
        "NODE_ENV=invalid",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate"]);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1);
    assert.match(output, /PORT/);
    assert.match(output, /DATABASE_URL/);
    assert.match(output, /NODE_ENV/);
    assert.doesNotMatch(output, new RegExp(secret));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI reports a missing environment file as an operational error", async () => {
  const directory = await createFixture();

  try {
    const result = runCli(directory, ["validate", "--env", ".env.missing"]);

    assert.equal(result.status, 2);

    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /Unable to read environment file/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI includes runtime environment variables when requested", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--include-process-env"], {
      NODE_ENV: "test",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("runtime environment variables override .env values", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=not-a-number",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--include-process-env"], {
      PORT: "8080",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI does not expose invalid runtime environment values", async () => {
  const directory = await createFixture();
  const secret = "runtime-secret-do-not-print";

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--include-process-env"], {
      NODE_ENV: secret,
    });

    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1);
    assert.match(output, /NODE_ENV/);
    assert.doesNotMatch(output, new RegExp(secret));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI ignores runtime environment variables by default", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate"], {
      NODE_ENV: "invalid-runtime-value",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI strict mode rejects unknown environment keys without exposing values", async () => {
  const directory = await createFixture();
  const secret = "unknown-key-secret-do-not-print";

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        `DATABSE_URL=${secret}`,
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--strict"]);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1);
    assert.match(output, /DATABSE_URL/);
    assert.doesNotMatch(output, new RegExp(secret));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI strict mode accepts configuration with only declared keys", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--strict"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI allows unknown environment keys when strict mode is disabled", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "OPTIONAL_EXTRA=value",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI strict mode ignores unrelated runtime environment keys", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(
      directory,
      ["validate", "--strict", "--include-process-env"],
      {
        NODE_ENV: "test",
        CONFIGGUARD_TEST_RUNTIME_EXTRA: "ignored",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration is valid/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI outputs valid JSON for successful validation", async () => {
  const directory = await createFixture();

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--format", "json"]);

    assert.equal(result.status, 0, result.stderr);

    const output = JSON.parse(result.stdout);
    assert.deepEqual(output, { success: true, errors: [] });
    assert.equal(result.stderr, "");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI outputs JSON validation errors without exposing secrets", async () => {
  const directory = await createFixture();
  const secret = "json-secret-do-not-print";

  try {
    await writeFile(
      join(directory, ".env"),
      [
        `APP_NAME=${secret}`,
        "PORT=not-a-number",
        "DATABASE_URL=",
        "NODE_ENV=invalid",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, ["validate", "--format", "json"]);

    assert.equal(result.status, 1);

    const output = JSON.parse(result.stdout);
    assert.equal(output.success, false);
    assert.ok(output.errors.length > 0);
    assert.ok(output.errors.some((error) => error.path === "PORT"));
    assert.doesNotMatch(result.stdout, new RegExp(secret));
    assert.equal(result.stderr, "");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI outputs JSON for strict-mode unknown keys without exposing values", async () => {
  const directory = await createFixture();
  const secret = "strict-json-secret-do-not-print";

  try {
    await writeFile(
      join(directory, ".env"),
      [
        "APP_NAME=ConfigGuard Test",
        "PORT=3000",
        "DATABASE_URL=postgresql://localhost/testdb",
        "NODE_ENV=test",
        `DATABSE_URL=${secret}`,
        "",
      ].join("\n"),
      "utf8",
    );

    const result = runCli(directory, [
      "validate",
      "--strict",
      "--format",
      "json",
    ]);

    assert.equal(result.status, 1);

    const output = JSON.parse(result.stdout);
    assert.equal(output.success, false);
    assert.ok(output.errors.some((error) => error.path === "DATABSE_URL"));
    assert.doesNotMatch(result.stdout, new RegExp(secret));
    assert.equal(result.stderr, "");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI outputs JSON for operational errors", async () => {
  const directory = await createFixture();

  try {
    const result = runCli(directory, [
      "validate",
      "--env",
      ".env.missing",
      "--format",
      "json",
    ]);

    assert.equal(result.status, 2);

    const output = JSON.parse(result.stdout);
    assert.equal(output.success, false);
    assert.ok(
      output.errors.some((error) =>
        error.message.includes("Unable to read environment file"),
      ),
    );
    assert.equal(result.stderr, "");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI rejects unsupported output formats", () => {
  const result = runCli(projectRoot, ["validate", "--format", "xml"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires either "text" or "json"/);
  assert.equal(result.stdout, "");
});

test("CLI rejects a missing output format", () => {
  const result = runCli(projectRoot, ["validate", "--format"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires either "text" or "json"/);
  assert.equal(result.stdout, "");
});
