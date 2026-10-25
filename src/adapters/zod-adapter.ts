import type { ZodType } from "zod";
import { formatPath } from "../format-path.js";
import type {
  ConfigValidationResult,
  ConfigValidator,
} from "../types.js";

export class ZodAdapter<T> implements ConfigValidator<T> {
  constructor(private readonly schema: ZodType<T>) {}

  validate(input: unknown): ConfigValidationResult<T> {
    const result = this.schema.safeParse(input);

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
}
