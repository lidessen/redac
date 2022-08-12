import { redac, watch } from "./core.ts";
import { TYPE } from "./symbol.ts";
import { useSyncExternalStore } from "https://esm.sh/use-sync-external-store@1.2.0/shim";

export function useRedac<T>(data: T) {
  const r = redac(data);
  const subscribe = (fn: () => void) => {
    return watch(r, fn);
  };
  const snapshot = () => {
    r[TYPE] === "ref" || r[TYPE] === "getter"
      ? Reflect.get(r, "current", r)
      : r;
  };
  return useSyncExternalStore(subscribe, snapshot);
}
