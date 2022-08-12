// deno-lint-ignore-file ban-types
import { equal } from "./equal.ts";
import { getProp } from "./helper.ts";
import { Subscription } from "./subscription.ts";
import { SUB, TRIGGER, TYPE } from "./symbol.ts";
import { isValueType, type Function, isFunc, AsyncFunction } from "./type.ts";

type Getter<T> = () => T;
type Callback<T> = (val: T) => void;
type Selecter<T> = () => T;
type CommonObject = Record<string | symbol | number, unknown>;

interface Observable<T> {
  [SUB](fn: (val: T) => void): () => void;
  [TRIGGER](): void;
  get [TYPE](): "ref" | "object" | "getter";
}

interface RedacValue<T> extends Observable<T> {
  get current(): T;
  [TRIGGER](): void;
}

type RedacObject<
  T extends
    | CommonObject
    | Ref<unknown>
    | unknown[]
    | Set<unknown>
    | Map<unknown, unknown>
    | WeakSet<object>
    | WeakMap<object, unknown>
> = T & T extends Ref<infer P> ? Observable<P> : Observable<T>;

type RedacFunc<T extends Function> = T & Observable<ReturnType<T>>;
type RedacAsyncFunc<T, P extends AsyncFunction<T>> = P & Observable<T>;

interface Ref<T> {
  current: T;
}

interface Subscriber<T> {
  current: T;
  selector: Selecter<T>;
}

function redacGetter<T>(getter: Getter<T>): RedacValue<T> {
  const listeners = new Set<Callback<T>>();

  return {
    get current() {
      return getter();
    },
    [SUB](fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    [TRIGGER]() {
      listeners.forEach((fn) => fn(getter()));
    },
    get [TYPE]() {
      return "getter" as const;
    },
  };
}

export function proxy<T>(r: Observable<T>, fn: Function) {
  if (typeof fn === "function") {
    return new Proxy(fn, {
      apply: (target, thisArg, args) => {
        r[TRIGGER]();
        return Reflect.apply(target, thisArg, args);
      },
    });
  }
  return fn;
}

export function spy<T extends Function>(fn: T, cb: Callback<void>) {
  if (typeof fn === "function") {
    return new Proxy(fn, {
      apply: (target, thisArg, args) => {
        cb();
        return Reflect.apply(target, thisArg, args);
      },
    });
  }
  return fn;
}

export function collect<T extends Observable<unknown>[]>(...rvals: T) {
  const listeners = new Map<Callback<unknown>, Subscriber<unknown>>();
  const subscriptions = new Subscription();

  const sub = () => {
    [...listeners.entries()].forEach(([fn, sub]) => {
      const val = sub.selector();
      if (!equal(val, sub.current)) {
        sub.current = val;
        fn(val);
      }
    });
  };

  for (const r of rvals) {
    subscriptions.add(r[SUB](sub));
  }

  const watch = <T>(selector: Selecter<T>, fn: Callback<T>) => {
    listeners.set(fn as Callback<unknown>, {
      current: selector(),
      selector,
    });

    return listeners.delete(fn as Callback<unknown>);
  };

  const select = <T>(selector: Selecter<T>): RedacValue<T> => {
    const val = redacGetter(selector);
    watch(selector, () => {
      val[TRIGGER]();
    });
    return val;
  };

  const cleanup = () => {
    subscriptions.dispose();
  };

  return {
    select,
    watch,
    cleanup,
  };
}

export function redac<T extends Function>(val: T): RedacFunc<T>;
export function redac<
  T extends
    | CommonObject
    | unknown[]
    | Set<unknown>
    | Map<unknown, unknown>
    | WeakSet<object>
    | WeakMap<object, unknown>
>(val: T): RedacObject<T>;
export function redac<T>(val: T): RedacObject<Ref<T>>;
export function redac<T extends unknown>(val: T): T;
export function redac<T>(obj: T) {
  if (isValueType(obj)) {
    return redacValue(obj);
  }
  if (typeof obj === "object") {
    return redacObject(obj as CommonObject);
  }
  if (isFunc(obj)) {
    return redacFunc(obj);
  }
}

export function redacAsync<T, P extends AsyncFunction<T>>(val: P) {
  return redacAsyncFunc(val) as RedacAsyncFunc<T, P>;
}

function redacObject<T extends CommonObject>(
  obj: T,
  keys?: (string | symbol)[]
) {
  const listeners = new Set<Callback<T>>();
  const trigger = (val = obj) =>
    listeners.forEach((fn) =>
      fn((val[TYPE] === "ref" ? val.current : val) as T)
    );
  return new Proxy(obj, {
    get(target, p) {
      if (p === SUB) {
        return (fn: Callback<T>) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        };
      }
      if (p === TRIGGER) {
        return () => {
          trigger(target);
        };
      }
      if (target instanceof Set) {
        if (p === "add" || p === "delete" || p === "clear") {
          return (...args: unknown[]) => {
            const res = Reflect.apply(target[p], target, args);
            trigger(target);
            return res;
          };
        }
      }
      if (target instanceof WeakSet) {
        if (p === "add" || p === "delete") {
          return (...args: unknown[]) => {
            const res = Reflect.apply(target[p], target, args);
            trigger(target);
            return res;
          };
        }
      }
      if (target instanceof Map) {
        if (p === "set" || p === "get" || p === "clear" || p === "delete") {
          return (...args: unknown[]) => {
            const res = Reflect.apply(target[p], target, args);
            trigger(target);
            return res;
          };
        }
      }
      if (target instanceof WeakMap) {
        if (p === "set" || p === "get" || p === "delete") {
          return (...args: unknown[]) => {
            const res = Reflect.apply(target[p], target, args);
            trigger(target);
            return res;
          };
        }
      }
      return getProp(target, p);
    },
    set(target, p, value) {
      target[p as keyof typeof target] = value;
      if (!keys || keys.includes(p)) {
        trigger(target);
      }
      return true;
    },
  }) as unknown as RedacObject<T>;
}

function redacValue<T extends string | number | bigint | undefined | null>(
  val: T
) {
  const obj = {
    current: val,
    [TYPE]: "ref",
  };
  return redacObject(obj);
}

function redacFunc<T extends Function>(val: T) {
  const listeners = new Set<Callback<unknown>>();
  const trigger = (val?: unknown) => listeners.forEach((fn) => fn(val));
  return new Proxy(val, {
    get(target, p) {
      if (p === SUB) {
        return (fn: Callback<unknown>) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        };
      }
      if (p === TRIGGER) {
        return trigger;
      }
      return getProp(target, p);
    },
    apply: (target, thisArg, args) => {
      const res = Reflect.apply(target, thisArg, args);
      trigger(res);
      return res;
    },
  }) as RedacFunc<T>;
}

function redacAsyncFunc<T extends AsyncFunction>(val: T) {
  const listeners = new Set<Callback<unknown>>();
  const trigger = (val?: unknown) => listeners.forEach((fn) => fn(val));
  return new Proxy(val, {
    get(target, p) {
      if (p === SUB) {
        return (fn: Callback<unknown>) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        };
      }
      if (p === TRIGGER) {
        return trigger;
      }
      return getProp(target, p);
    },
    apply: (target, thisArg, args) => {
      const res = Reflect.apply(target, thisArg, args);
      res.then(trigger);
      return res;
    },
  }) as RedacFunc<T>;
}

// function redacFunc<T extends Function>() {}

export function watch<T>(r: Observable<T>, fn: Callback<T>) {
  return r[SUB](fn);
}
