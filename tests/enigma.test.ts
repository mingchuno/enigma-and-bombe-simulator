import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CONFIG,
  Enigma,
  normalizeText,
  parsePlugboard,
} from "../src/engine/enigma.ts";

const machine = (overrides = {}) =>
  new Enigma({ ...DEFAULT_CONFIG, ...overrides });

test("published encryption vector and reset decryption", () => {
  assert.equal(machine().process("AAAAA"), "BDZGO");
  assert.equal(machine().process("BDZGO"), "AAAAA");
  assert.equal(machine().process("HELLOWORLD"), "ILBDAAMTAZ");
});

test("middle rotor double steps; rings do not move visible turnover letters", () => {
  for (const rings of ["AAA", "BUL"]) {
    const enigma = machine({
      rotors: ["III", "II", "I"],
      windows: "KDO",
      rings,
    });
    const windows = Array.from({ length: 6 }, () => {
      enigma.press("A");
      return enigma.windows;
    });
    assert.deepEqual(windows, ["KDP", "KDQ", "KER", "LFS", "LFT", "LFU"]);
  }
});

test("nonzero rings and ten plugs reproduce independent fixture", () => {
  const config = {
    rotors: ["II", "IV", "V"],
    rings: "BUL",
    plugs: "AV BS CG DL FU HZ IN KM OW RX",
  };
  assert.equal(machine({ ...config, windows: "WXC" }).process("KCH"), "BLA");
  assert.equal(
    machine({ ...config, windows: "BLA" }).process("NIBLFMYMLLUFWCASCSSNVHAZ"),
    "THEXRUSSIANSXAREXCOMINGX",
  );
});

test("fixed-state maps are reciprocal and have no fixed points", () => {
  const enigma = machine({ rings: "BUL", windows: "ZEV", plugs: "AZ BY CX" });
  for (let i = 0; i < 26; i++) {
    const result = enigma.scramble(i);
    assert.notEqual(result, i);
    assert.equal(enigma.scramble(result), i);
  }
});

test("stepping wraps and simultaneous notches advance each wheel once", () => {
  const enigma = machine({ windows: "ZEV" });
  enigma.press("A");
  assert.equal(enigma.windows, "AFW");
  const wrap = machine({ windows: "ZZZ" });
  wrap.press("A");
  assert.equal(wrap.windows, "ZZA");
});

test("invalid configuration fails with actionable errors", () => {
  assert.throws(() => parsePlugboard("AB AC"), /already/);
  assert.throws(() => parsePlugboard("AA"), /different/);
  assert.throws(() => parsePlugboard("ABC"), /two/);
  assert.throws(() => machine({ rotors: ["I", "I", "III"] }), /distinct/);
  assert.throws(() => machine({ rings: "AA" }), /three/);
  assert.throws(() => machine({ reflector: "D" }), /reflector/i);
});

test("normalization is explicit; core rejects characters rather than stepping silently", () => {
  assert.equal(normalizeText("Hello, world! 123"), "HELLOWORLD");
  const enigma = machine();
  assert.throws(() => enigma.press(" "), /A–Z/);
  assert.equal(enigma.windows, "AAA");
});

test("trace describes the actual signal and positions", () => {
  const trace = machine().press("A");
  assert.equal(trace.output, "B");
  assert.equal(trace.before, "AAA");
  assert.equal(trace.after, "AAB");
  assert.equal(trace.path[0].letter, "A");
  assert.equal(trace.path.at(-1).letter, "B");
});

test("trace shows both plugboard passes before the separate lamp stage", () => {
  const trace = machine({ plugs: "AB CD" }).press("A");
  assert.equal(trace.path[1].label, "Plugboard →");
  assert.equal(trace.path[1].letter, "B");
  assert.equal(trace.path.at(-2)?.label, "Plugboard ←");
  assert.equal(trace.path.at(-1)?.label, "Lamp");
  assert.equal(trace.path.at(-2)?.letter, trace.output);
});

test("reflector C agrees with independent Py-Enigma fixtures, including turnover", () => {
  // Py-Enigma 1.0.2; reproducible settings documented in historical-accuracy-audit.md.
  assert.equal(machine({ reflector: "C" }).process("AAAAA"), "PJBUZ");
  const enigma = machine({
    rotors: ["V", "IV", "II"],
    reflector: "C",
    rings: "BUL",
    windows: "ZJZ",
    plugs: "AV BS CG DL FU HZ IN KM OW RX",
  });
  assert.equal(
    enigma.process("ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    "ZWHBZKRWZYVGXXIQFDGPEYBBPBRYPGKQJMGNSMREZJEAGNMFVFPE",
  );
  assert.equal(enigma.windows, "AMZ");
});

test("each rotor I–V turns over at its visible notch with nonzero rings", () => {
  for (const [rotor, notch, next] of [
    ["I", "Q", "R"],
    ["II", "E", "F"],
    ["III", "V", "W"],
    ["IV", "J", "K"],
    ["V", "Z", "A"],
  ]) {
    const others = ["I", "II", "III"]
      .filter((name) => name !== rotor)
      .slice(0, 2);
    const enigma = machine({
      rotors: [...others, rotor],
      windows: `AA${notch}`,
      rings: "ZMC",
    });
    assert.equal(enigma.press("A").after, `AB${next}`);
  }
});
