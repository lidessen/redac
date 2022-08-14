import { redac, clone, equal, watch } from "./core.ts";
import { interval } from "./iter.ts";

const a = redac({
  count: 123,
  add() {
    this.count++;
  },
});
const b = clone(a);

console.log(a === b);
b.count = 456;

console.log(a, b);
console.log(equal(a, b));

watch(a, console.log);

interval(1000).subscribe(a.add);
