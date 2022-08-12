import { equal } from "./equal.ts";
import { Subscription } from "./subscription.ts";

type Getter<T> = () => T;
type Callback<T> = (val: T) => void;
type Selecter<T> = () => T;
type CommonObject = Record<string | symbol | number, unknown>;
type Function = (...args: unknown[]) => unknown;

interface Observable<T> {
  [SUB](fn: (val: T) => void): () => void;
  [TRIGGER](): void;
  get [TYPE](): "ref" | "object" | "getter";
}

interface RedacValue<T> extends Observable<T> {
  get current(): T;
  [TRIGGER](): void;
}

type RedacObject<T extends CommonObject | Ref<unknown>> = T & Observable<T>;

interface Ref<T> {
  current: T;
}

interface Subscriber<T> {
  current: T;
  selector: Selecter<T>;
}

const SUB = Symbol("sub");
const TRIGGER = Symbol("trigger");
const TYPE = Symbol("type");

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

export function proxy<T>(r: RedacValue<T>, fn: Function) {
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
    cleanup,
  };
}

export function redac<T extends CommonObject>(val: T): RedacObject<T>;
export function redac<T>(val: T): RedacObject<Ref<T>>;
export function redac<T extends unknown>(val: T): T;
export function redac<T>(obj: T) {
  if (isValueType(obj)) {
    return redacValue(obj);
  }
  if (typeof obj === "object") {
    return redacObject(obj as CommonObject);
  }
  if (typeof obj === "function") {
    return obj;
  }
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
      return target[p];
    },
    set(target, p, value) {
      target[p as keyof typeof target] = value;
      if (!keys || keys.includes(p)) {
        trigger(target);
      }
      return true;
    },
  }) as RedacObject<T>;
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

// function redacFunc<T extends Function>() {}

function isValueType(
  obj: unknown
): obj is string | number | bigint | undefined | null {
  return (
    ["bigint", "boolean", "number", "string"].includes(typeof obj) ||
    obj === null
  );
}

export function watch<T>(r: Observable<T>, fn: Callback<T>) {
  r[SUB](fn);
}
