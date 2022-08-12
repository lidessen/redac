import { redac, watch } from "./core.ts";
import { TYPE } from "./symbol.ts";
import { useSyncExternalStoreWithSelector } from "https://esm.sh/use-sync-external-store@1.2.0/shim";
import { equal } from "./equal.ts";

export function useRedac<T, P = T>(data: T, selector?: (state: T) => P): P {
  const r = redac(data);
  const subscribe = (fn: () => void) => {
    return watch(r, fn);
  };
  const snapshot = () => {
    return (
      r[TYPE] === "ref" || r[TYPE] === "getter"
        ? Reflect.get(r, "current", r)
        : r
    ) as P;
  };
  return useSyncExternalStoreWithSelector(
    subscribe,
    snapshot,
    snapshot,
    selector || (() => snapshot()),
    equal
  );
}
