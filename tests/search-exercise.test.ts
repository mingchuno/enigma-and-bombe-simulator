import assert from "node:assert/strict";
import test from "node:test";
import type { MachineConfig } from "../src/engine/enigma.ts";
import { DEFAULT_CONFIG, Enigma } from "../src/engine/enigma.ts";
import {
  createDemoSearch,
  searchFromExercise,
} from "../src/workbench/search-exercise.ts";

test("transfers preserve known assumptions but withhold the key being searched", () => {
  const config: MachineConfig = {
    rotors: ["V", "III", "II"],
    rings: "BUL",
    reflector: "C",
    windows: "XYZ",
    plugs: "AB CD",
  };
  const exercise = { config, ciphertext: "BCD", crib: "ABC" };
  const search = searchFromExercise(exercise);
  assert.deepEqual(search, {
    config: { ...config, windows: "AAA", plugs: "" },
    ciphertext: "BCD",
    crib: "ABC",
    offset: 0,
    allOrders: false,
    maxPairs: 13,
  });
  search.config.rotors[0] = "I";
  assert.equal(config.rotors[0], "V");
  assert.equal(config.windows, "XYZ");
  assert.equal(config.plugs, "AB CD");
});

test("the generated exercise hides its start and plugs and can be independently replayed", () => {
  const draft = createDemoSearch();
  assert.deepEqual(draft.config, DEFAULT_CONFIG);
  assert.equal(draft.maxPairs, 4);
  assert.equal(
    new Enigma({
      ...draft.config,
      windows: "AAF",
      plugs: "AV BS CG DL",
    }).process(draft.ciphertext),
    draft.crib,
  );
  draft.config.rotors[0] = "V";
  assert.equal(createDemoSearch().config.rotors[0], "I");
});
