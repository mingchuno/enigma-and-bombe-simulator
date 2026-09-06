import assert from "node:assert/strict";
import test from "node:test";
import { buildMenu, inspectCribAlignment } from "../src/engine/crib-menu.ts";

test("alignment inspection and menu validation agree at placement boundaries", () => {
  for (const offset of [-1, 0.5, 4]) {
    assert.equal(inspectCribAlignment("ABCDE", "ZZ", offset).fits, false);
    assert.throws(() => buildMenu("ABCDE", "ZZ", offset), /fit/);
  }
  for (const offset of [0, 3]) {
    assert.deepEqual(inspectCribAlignment("ABCDE", "ZZ", offset), {
      maximum: 3,
      fits: true,
      collisions: [],
    });
    assert.deepEqual(
      buildMenu("ABCDE", "ZZ", offset).map((edge) => edge.position),
      [offset, offset + 1],
    );
  }
  assert.equal(inspectCribAlignment("ABC", "", 0).fits, false);
  assert.equal(inspectCribAlignment("", "A", 0).fits, false);
});

test("all collisions are inspectable while menu validation reports the first message position", () => {
  const alignment = inspectCribAlignment("ZABCD", "AXC", 1);
  assert.deepEqual(alignment.collisions, [1, 3]);
  assert.throws(
    () => buildMenu("ZABCD", "AXC", 1),
    /At position 2, A would encrypt to itself/,
  );
  assert.throws(() => buildMenu("abc", "X", 0), /using A–Z/);
});
