import {
  watch,
  Observable,
  RedacResult,
  redac,
  CommonObjects,
  CommonValues,
} from "./core.ts";
import { CLONE, TYPE } from "./symbol.ts";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { equal } from "./equal.ts";

export function useRedac<T>(r: Observable<T>): T;
export function useRedac<T, P>(r: Observable<T>, selector: (state: T) => P): P;
export function useRedac<T>(r: Observable<T>, selector = (x: T) => x) {
  const subscribe = (fn: () => void) => {
    return watch(r, fn);
  };
  const snapshot = () => {
    return (
      r[TYPE] === "ref" || r[TYPE] === "getter"
        ? Reflect.get(r, "current", r)
        : r
    ) as T;
  };
  return useSyncExternalStoreWithSelector(
    subscribe,
    snapshot,
    snapshot,
    selector || snapshot,
    equal
  );
}

export function useRedacState<T extends CommonObjects | CommonValues>(
  data: T
): RedacResult<T> {
  const r = redac<unknown>(data);

  const subscribe = (fn: () => void) => {
    return watch(r, fn);
  };
  const snapshot = () => {
    return r[CLONE]() as RedacResult<T>;
  };

  return useSyncExternalStoreWithSelector(
    subscribe,
    snapshot,
    snapshot,
    snapshot,
    equal
  );
}
