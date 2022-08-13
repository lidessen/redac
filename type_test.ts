import { assertEquals } from "testing/asserts.ts";
import { isFunc, isValueType } from "./type.ts";

Deno.test("Test `isFunc`", () => {
  assertEquals(
    isFunc(() => {}),
    true
  );

  assertEquals(isFunc(0), false);
});

Deno.test("Test `isValueType`", async (t) => {
  await t.step("function", () => {
    assertEquals(
      isValueType(() => {}),
      false
    );
  });

  await t.step("number", () => {
    assertEquals(isValueType(0), true);
  });

  await t.step("string", () => {
    assertEquals(isValueType(""), true);
  });

  await t.step("undefined", () => {
    assertEquals(isValueType(undefined), true);
  });

  await t.step("null", () => {
    assertEquals(isValueType(null), true);
  });
});
