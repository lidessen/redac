import { SubscribeIterator, ManualIterator, interval } from "./iter.ts";

const _interval = interval(1000);

const sub_iter = new SubscribeIterator(_interval.subscribe, _interval.dispose);
const manual_iter = new ManualIterator<number>();

let i = 0;

_interval.subscribe(() => {
  i++;
  if (i > 10) {
    // return _interval.dispose();
  }
  manual_iter.next(i);
});

(async function () {
  for await (const _ of sub_iter) {
    console.log("SubscribeIterator");
  }
})();

(async function () {
  for await (const t of manual_iter) {
    if (i > 10) {
      manual_iter.cleanup();
    }
    console.log("ManualIterator", t);
  }
})();
