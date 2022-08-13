import { redac, clone, equal } from "./core.ts";

const a = redac({ a: 123 });
const b = clone(a);

console.log(a === b);
b.a = 456;

console.log(a, b);
console.log(equal(a, b));
