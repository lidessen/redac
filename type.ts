export function isValueType(
  obj: unknown
): obj is string | number | bigint | undefined | null {
  return (
    ["bigint", "boolean", "number", "string", "undefined"].includes(
      typeof obj
    ) || obj === null
  );
}

export type Function = (...args: unknown[]) => unknown;
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;

export function isFunc(obj: unknown): obj is Function {
  return typeof obj === "function";
}
