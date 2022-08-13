import { abortable } from "async/mod.ts";

type Callback<T> = (val: T) => void;
type Subscribe<T> = (fn: Callback<T>) => void;

export class SubscribeIterator<T> {
  private resolve!: Callback<T>;
  private cleanupSub: () => void;
  private abort: AbortController = new AbortController();

  constructor(subscribe: Subscribe<T>, cleanup: () => void) {
    subscribe((val) => {
      this.resolve?.(val);
    });
    this.cleanupSub = cleanup;
  }

  private generate() {
    return abortable(
      new Promise<T>((resolve) => {
        this.resolve = resolve;
      }),
      this.abort.signal
    );
  }

  async *[Symbol.asyncIterator]() {
    while (!this.abort.signal.aborted) {
      yield await this.generate();
    }
  }

  cleanup() {
    this.cleanupSub();
    this.abort.abort();
  }
}

export class ManualIterator<T> {
  private resolve!: Callback<T>;
  private abort: AbortController = new AbortController();

  private generate() {
    return abortable(
      new Promise<T>((resolve) => {
        this.resolve = resolve;
      }),
      this.abort.signal
    );
  }

  async *[Symbol.asyncIterator]() {
    while (!this.abort.signal.aborted) {
      yield await this.generate();
    }
  }

  next(val: T) {
    this.resolve(val);
  }

  cleanup() {
    this.abort.abort();
  }
}

export function interval(t: number) {
  const listeners = new Set<Callback<void>>();

  let disposed = false;

  const id = setInterval(() => {
    if (!disposed) {
      listeners.forEach((fn) => fn());
    }
  }, t);

  return {
    subscribe: (fn: Callback<void>) => {
      if (!disposed) {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      }

      throw new Error("Interval is stoped");
    },
    dispose: () => {
      disposed = true;
      listeners.clear();
      clearInterval(id);
    },
  };
}
