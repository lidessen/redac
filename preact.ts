import { useMemo, useCallback, useState, useEffect } from "preact/hooks";
import {
  CommonObjects,
  CommonValues,
  RedacResult,
  redac,
  watch,
} from "./core.ts";

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
