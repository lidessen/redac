import { isValueType } from "./type.ts";

export function clone<T>(obj: T): T {
  if (typeof obj === "object") {
    if (obj instanceof Map) {
      return new Map([...obj]) as unknown as T;
    }
    if (obj instanceof Set) {
      return new Set([...obj]) as unknown as T;
    }
    if (obj instanceof Array) {
      return [...obj] as unknown as T;
    }
    if (obj instanceof Date) {
      return new Date(obj.valueOf()) as unknown as T;
    }
    if (obj instanceof File) {
      return new File([obj.slice()], obj.name, {
        type: obj.type,
      }) as unknown as T;
    }
    if (typeof obj === "object") {
      return { ...obj };
    }
  }
  return obj;
}
