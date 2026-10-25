import type { ZodType } from "zod";

export type ConfigValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: Array<{
        path: string;
        message: string;
      }>;
    };

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path
    .map((segment) =>
      String(segment).replace(/\\/g, "\\\\").replace(/\./g, "\\."),
    )
    .join(".");
}

export function validateConfig<T>(
  input: unknown,
  schema: ZodType<T>,
): ConfigValidationResult<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        path: formatPath(issue.path),
        message: issue.message,
      })),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
