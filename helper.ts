export function bind<T, V>(target: T, v: V) {
  return typeof v === "function"
    ? (...args: unknown[]) => {
        return Reflect.apply(v, target, args);
      }
    : v;
}

export function getProp(
  // deno-lint-ignore ban-types
  target: object,
  p: PropertyKey,
  // deno-lint-ignore ban-types
  _bind: object = target
) {
  const v = Reflect.get(target, p, _bind);
  return bind(_bind, v);
}
