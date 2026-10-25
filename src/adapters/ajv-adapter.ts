
import type { ErrorObject, ValidateFunction } from "ajv";
import { formatPath } from "../format-path.js";
import type {
  ConfigValidationResult,
  ConfigValidator,
} from "../types.js";

export class AjvAdapter<T> implements ConfigValidator<T> {
  constructor(private readonly validateFunction: ValidateFunction<T>) {}

  validate(input: unknown): ConfigValidationResult<T> {
    const valid = this.validateFunction(input);

    if (!valid) {
      const errors = (this.validateFunction.errors ?? []).map(
        (error: ErrorObject) => {
          const segments: string[] =
            error.instancePath === ""
              ? []
              : error.instancePath
                  .split("/")
                  .slice(1)
                  .map((segment) =>
                    segment.replace(/~1/g, "/").replace(/~0/g, "~"),
                  );

          // Ajv reports these property names separately from instancePath.
          if (
            error.keyword === "required" &&
            typeof error.params.missingProperty === "string"
          ) {
            segments.push(error.params.missingProperty);
          } else if (
            error.keyword === "additionalProperties" &&
            typeof error.params.additionalProperty === "string"
          ) {
            segments.push(error.params.additionalProperty);
          }

          return {
            path: formatPath(segments),
            message: error.message ?? "Validation failed",
          };
        },
      );

      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: input as T,
    };
  }
}
