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

export function validateConfig<T>(
  input: unknown,
  schema: ZodType<T>,
): ConfigValidationResult<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
