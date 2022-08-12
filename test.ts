import { collect, redac, watch } from "./core.ts";

const count = redac(0);
const state = redac({
  count: 0,
});

setInterval(() => count.current++, 100);
setInterval(() => state.count++, 1000);

const { select } = collect(count, state);

const db = select(() => state.count + count.current);

watch(db, console.log);
