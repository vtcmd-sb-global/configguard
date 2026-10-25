export interface ConfigValidationError {
  path: string;
  message: string;
}

export type ConfigValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ConfigValidationError[];
    };

export interface ConfigValidator<T> {
  validate(input: unknown): ConfigValidationResult<T>;
}
