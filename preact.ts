import {
  watch,
  Observable,
  RedacResult,
  redac,
  CommonObjects,
  CommonValues,
  select,
} from "./core.ts";
import { TYPE, VALUE } from "./symbol.ts";
import {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useSyncExternalStore,
} from "preact/compat";
import { clone } from "./clone.ts";

export function useRedac<T>(r: Observable<T>): T;
export function useRedac<T, P>(r: Observable<T>, selector: (state: T) => P): P;
export function useRedac<T, P>(r: Observable<T>, selector?: (state: T) => P) {
  const subscribe = (fn: () => void) => {
    return watch<T | P>(selector ? select(r, selector) : r, fn);
  };
  const snapshot = () => {
    return (
      r[TYPE] === "ref" || r[TYPE] === "getter"
        ? Reflect.get(r, "current", r)
        : clone(Reflect.get(r, VALUE))
    ) as T;
  };
  return useSyncExternalStore(subscribe, snapshot);
}

export function useRedacState<T extends CommonObjects | CommonValues>(
  data: T
): RedacResult<T> {
  const r = useMemo(() => redac<unknown>(data), []);

  const subscribe = useCallback(
    (fn: () => void) => {
      return watch(r, fn);
    },
    [r]
  );

  const [{ _instance }, forceUpdate] = useState({
    _instance: r,
  });

  useEffect(() => {
    return subscribe(() => {
      forceUpdate({ _instance: r });
    });
  }, [subscribe]);

  return _instance as RedacResult<T>;
}
