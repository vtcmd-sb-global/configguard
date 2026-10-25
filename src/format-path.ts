export function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path
    .map((segment) =>
      String(segment).replace(/\\/g, "\\\\").replace(/\./g, "\\."),
    )
    .join(".");
}
