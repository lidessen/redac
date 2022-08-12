export function bind<T, V>(target: T, v: V) {
  return typeof v === "function"
    ? (...args: unknown[]) => {
        return Reflect.apply(v, target, args);
      }
    : v;
}

// deno-lint-ignore ban-types
export function getProp(target: object, p: PropertyKey) {
  const v = Reflect.get(target, p, target);
  return bind(target, v);
}
