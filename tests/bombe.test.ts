import test from "node:test";
import assert from "node:assert/strict";
import { Enigma, DEFAULT_CONFIG } from "../src/engine/enigma.ts";
import {
  buildMenu,
  solveMenu,
  scramblerEdges,
  searchBombe,
  rotorOrders,
} from "../src/engine/bombe.ts";

const config = {
  ...DEFAULT_CONFIG,
  rotors: ["III", "II", "I"],
  windows: "KDQ",
  rings: "BUL",
  plugs: "AZ BY CX",
};
const plaintext = "WETTERVORHERSAGEFUERDIEBISKAYA";

test("alignment rejects self-encryption and preserves repeated position edges", () => {
  assert.throws(() => buildMenu("ABCDEFGH", "ABCDEFGH", 0), /itself/);
  assert.throws(() => buildMenu("ABCDEFGH", "WETTERVOR", 0), /fit/);
  const menu = buildMenu("BBBBBBBB", "AAAAAAAA", 0);
  assert.equal(menu.length, 8);
  assert.deepEqual(
    menu.map((edge) => edge.position),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
});

test("constraint search retains true settings across double stepping and nonzero rings", () => {
  const cipher = new Enigma(config).process(plaintext);
  const menu = buildMenu(cipher, plaintext, 0);
  const edges = scramblerEdges(config, menu);
  const solution = solveMenu(edges, { maxPairs: 3 });
  assert.equal(solution.status, "match");
  const plugs = solution.pairs.join(" ");
  assert.equal(new Enigma({ ...config, plugs }).process(plaintext), cipher);
});

test("nonzero crib offset steps from message start", () => {
  const cipher = new Enigma(config).process(plaintext);
  const edges = scramblerEdges(
    config,
    buildMenu(cipher, plaintext.slice(7), 7),
  );
  const result = solveMenu(edges, { maxPairs: 3 });
  assert.equal(result.status, "match");
  const output = new Enigma({
    ...config,
    plugs: result.pairs.join(" "),
  }).process(plaintext);
  assert.equal(output.slice(7), cipher.slice(7));
});

test("all 60 rotor orders are unique", () => {
  assert.equal(rotorOrders().length, 60);
  assert.equal(new Set(rotorOrders().map((order) => order.join())).size, 60);
});

test("search returns checked candidate, explicit result limit, and a witness plugboard", () => {
  const ciphertext = new Enigma(DEFAULT_CONFIG).process(plaintext);
  const updates = [
    ...searchBombe({
      config: DEFAULT_CONFIG,
      ciphertext,
      crib: plaintext,
      offset: 0,
      allOrders: false,
      maxPairs: 0,
      resultLimit: 1,
    }),
  ];
  const final = updates.at(-1);
  assert.equal(final.reason, "limit");
  assert.equal(final.candidates[0].windows, "AAA");
  assert.equal(final.candidates[0].plaintext, plaintext);
});

test("budget exhaustion is reported as unresolved, never a rejection", () => {
  const edges = [{ a: 0, b: 1, position: 0, mapping: [1, 0, 3, 2] }];
  assert.equal(
    solveMenu(edges, { maxPairs: 2, alphabetSize: 4, branchLimit: 0 }).status,
    "unresolved",
  );
});

function involutions(
  size,
  maxPairs,
  partial = Array(size).fill(-1),
  pairs = 0,
) {
  const next = partial.indexOf(-1);
  if (next < 0) return [partial];
  const results = [];
  for (let partner = next; partner < size; partner++) {
    if (partial[partner] !== -1 || pairs + Number(partner !== next) > maxPairs)
      continue;
    const copy = [...partial];
    copy[next] = partner;
    copy[partner] = next;
    results.push(
      ...involutions(size, maxPairs, copy, pairs + Number(partner !== next)),
    );
  }
  return results;
}

test("solver agrees with exhaustive toy plugboards including disconnected menus and conflicts", () => {
  const mappings = [
    [1, 0, 3, 2, 5, 4],
    [2, 3, 0, 1, 5, 4],
    [5, 2, 1, 4, 3, 0],
  ];
  for (let seed = 0; seed < 80; seed++) {
    const edges = Array.from({ length: 4 }, (_, i) => ({
      a: (seed + i * 2) % 6,
      b: (seed * 3 + i + 1) % 6,
      position: i,
      mapping: mappings[(seed + i) % mappings.length],
    }));
    for (const maxPairs of [0, 1, 3]) {
      const exists = involutions(6, maxPairs).some((p) =>
        edges.every((e) => p[e.b] === e.mapping[p[e.a]]),
      );
      const result = solveMenu(edges, { maxPairs, alphabetSize: 6 });
      assert.equal(
        result.status === "match",
        exists,
        `seed ${seed}, pairs ${maxPairs}`,
      );
    }
  }
});
