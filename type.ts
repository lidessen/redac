export function isValueType(
  obj: unknown
): obj is string | number | bigint | undefined | null {
  return (
    ["bigint", "boolean", "number", "string"].includes(typeof obj) ||
    obj === null
  );
}
