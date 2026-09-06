import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CONFIG } from "../src/engine/enigma.ts";
import {
  compareStrips,
  driveState,
  electricalReachability,
  historicalScramblers,
  relativeLabel,
} from "../src/engine/historical.ts";

test("39 point drive has 26 sense points and 13 unsensed carry points", () => {
  assert.equal(driveState(25).sensing, true);
  assert.equal(driveState(26).sensing, false);
  assert.equal(driveState(38).sensing, false);
  assert.deepEqual(driveState(39).cores, [13, 1, 0]);
  const states = new Set();
  for (let point = 0; point < 39 * 26 * 26; point++) {
    const state = driveState(point);
    if (state.sensing) states.add(state.cores.join(","));
  }
  assert.equal(states.size, 17576);
});

test("menu notation uses ZZZ reference and position-one ZZA without inventing turnovers", () => {
  assert.equal(relativeLabel(0), "ZZA");
  assert.equal(relativeLabel(11), "ZZL");
  assert.equal(relativeLabel(25), "ZZZ");
  assert.equal(relativeLabel(26), "+27");
});

test("relative offsets move bottom/right core, and mapping remains reciprocal", () => {
  const edges = historicalScramblers(
    DEFAULT_CONFIG,
    [
      { a: 0, b: 1, position: 0 },
      { a: 1, b: 2, position: 4 },
    ],
    0,
  );
  assert.equal(edges[0].windows, "AAB");
  assert.equal(edges[1].windows, "AAF");
  for (const edge of edges)
    for (let i = 0; i < 26; i++) assert.equal(edge.mapping[edge.mapping[i]], i);
});

test("diagonal board propagates reciprocal hypotheses, without declaring a recovered key", () => {
  const result = electricalReachability([], 0, 1, true);
  assert.equal(result.live[0 * 26 + 1], true);
  assert.equal(result.live[1 * 26 + 0], true);
  assert.equal(result.registerCount, 1);
  assert.equal(electricalReachability([], 0, 1, false).live[26], false);
});

test("paper strip alignment counts real letter coincidences and handles both shifts", () => {
  assert.deepEqual(compareStrips("ABCDE", "XBCD", 0).matches, [1, 2, 3]);
  assert.deepEqual(compareStrips("ABCDE", "BCD", 1).matches, [1, 2, 3]);
  assert.equal(compareStrips("ABCDE", "XABC", -1).overlap, 3);
});
