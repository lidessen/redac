import { collect, redac, redacAsync, watch } from "./core.ts";

const count = redac(0);
const state = redac<number[]>([]);
const set = redac(new Set<number>());

const trigger = redac(() => {
  console.log("trigger");
  return new Promise((resolve) => {
    setTimeout(() => resolve(count.current), 1000);
  });
});

const asyncTrigger = redacAsync(() => {
  console.log("async trigger");
  return new Promise((resolve) => {
    setTimeout(() => resolve(count.current), 300);
  });
});

setInterval(() => count.current++, 100);
setInterval(() => state.push(count.current), 1000);
// setInterval(asyncTrigger, 3000);
setInterval(() => set.add(count.current), 3000);

const { select } = collect(count, state, trigger);

const computed = select(() => state[state.length - 1] + count.current);

// watch(computed, console.log);
watch(asyncTrigger, (val) => {
  console.log("trigger value", val);
});

watch(set, (val) => console.log("set", val));
