/** Enigma I conventions and wiring sources: docs/research/enigma-and-bombe.md. */
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const ALPHABET_SIZE = ALPHABET.length;
export const ROTOR_SLOT = { LEFT: 0, MIDDLE: 1, RIGHT: 2 } as const;
export type RotorSlot = (typeof ROTOR_SLOT)[keyof typeof ROTOR_SLOT];
export const ROTOR_SLOTS = [
  ROTOR_SLOT.LEFT,
  ROTOR_SLOT.MIDDLE,
  ROTOR_SLOT.RIGHT,
] as const;
export const ROTOR_COUNT = ROTOR_SLOTS.length;
export const WINDOW_SETTING_COUNT = ALPHABET_SIZE ** ROTOR_COUNT;
export const MAX_PLUGBOARD_PAIRS = ALPHABET_SIZE / 2;
const FORWARD_ROTOR_SLOTS = [...ROTOR_SLOTS].reverse();
// A key and an entry plugboard precede the forward rotor traversal.
export const REFLECTOR_TRACE_INDEX = 2 + ROTOR_COUNT;
const ROTOR_SETTING_PATTERN = new RegExp(`^[A-Z]{${ROTOR_COUNT}}$`);
export const ROTOR_NAMES = ["I", "II", "III", "IV", "V"] as const;
export type RotorName = (typeof ROTOR_NAMES)[number];
export type Triple<T> = [T, T, T];
export interface MachineConfig {
  rotors: Triple<RotorName>;
  rings: string;
  windows: string;
  reflector: "B" | "C";
  plugs: string;
}
export interface SignalStep {
  label: string;
  letter: string;
}
export interface Trace {
  input: string;
  output: string;
  before: string;
  after: string;
  stepped: boolean[];
  path: SignalStep[];
}
export const DEFAULT_CONFIG: MachineConfig = {
  rotors: ["I", "II", "III"],
  rings: "AAA",
  windows: "AAA",
  reflector: "B",
  plugs: "",
};
const specifications: Record<RotorName, [string, string]> = {
  I: ["EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"],
  II: ["AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"],
  III: ["BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"],
  IV: ["ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"],
  V: ["VZBRGITYUPSDNHLXAWMJQOFECK", "Z"],
};
const indices = (letters: string): number[] =>
  [...letters].map((letter) => ALPHABET.indexOf(letter));
const reflectors = {
  B: indices("YRUHQSLDPXNGOKMIEBFZCWVJAT"),
  C: indices("FVPJIAOYEDRZXWGCTKUQSBNMHL"),
};
export const mod26 = (value: number): number =>
  ((value % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
export const normalizeText = (text: string): string =>
  text.toUpperCase().replace(/[^A-Z]/g, "");

const rotors = Object.fromEntries(
  ROTOR_NAMES.map((name) => {
    const [wiring, notch] = specifications[name];
    const forward = indices(wiring);
    const reverse = Array<number>(ALPHABET_SIZE);
    forward.forEach((value, index) => {
      reverse[value] = index;
    });
    return [name, { forward, reverse, notch: ALPHABET.indexOf(notch) }];
  }),
) as Record<RotorName, { forward: number[]; reverse: number[]; notch: number }>;

export function parsePlugboard(text: string): number[] {
  const mapping = Array.from({ length: ALPHABET_SIZE }, (_, index) => index);
  const used = new Set<string>();
  for (const pair of text.trim().toUpperCase().split(/\s+/).filter(Boolean)) {
    if (!/^[A-Z]{2}$/.test(pair))
      throw new Error("Each plug pair needs two letters, for example AB CD.");
    const [a, b] = pair;
    if (a === b) throw new Error("A cable must connect two different letters.");
    if (used.has(a) || used.has(b))
      throw new Error(
        `A letter in ${pair} is already connected. Use each letter once.`,
      );
    used.add(a);
    used.add(b);
    mapping[ALPHABET.indexOf(a)] = ALPHABET.indexOf(b);
    mapping[ALPHABET.indexOf(b)] = ALPHABET.indexOf(a);
  }
  return mapping;
}

export function validateConfig(config: MachineConfig): void {
  if (
    config.rotors.length !== ROTOR_COUNT ||
    new Set(config.rotors).size !== ROTOR_COUNT ||
    config.rotors.some((name) => !rotors[name])
  ) {
    throw new Error("Choose three distinct rotors from I–V.");
  }
  if (
    !ROTOR_SETTING_PATTERN.test(config.windows) ||
    !ROTOR_SETTING_PATTERN.test(config.rings)
  ) {
    throw new Error("Windows and rings must each contain three letters A–Z.");
  }
  if (!reflectors[config.reflector])
    throw new Error("Choose reflector B or C.");
  parsePlugboard(config.plugs);
}

export class Enigma {
  private positions: number[];
  private readonly ringOffsets: number[];
  private readonly wheels: (typeof rotors)[RotorName][];
  private readonly plugboard: number[];
  private readonly reflector: number[];
  private readonly names: RotorName[];

  constructor(config: MachineConfig) {
    validateConfig(config);
    this.positions = indices(config.windows);
    this.ringOffsets = indices(config.rings);
    this.wheels = config.rotors.map((name) => rotors[name]);
    this.names = [...config.rotors];
    this.plugboard = parsePlugboard(config.plugs);
    this.reflector = reflectors[config.reflector];
  }

  get windows(): string {
    return this.positions.map((index) => ALPHABET[index]).join("");
  }

  step(): boolean[] {
    const middleNotch =
      this.positions[ROTOR_SLOT.MIDDLE] ===
      this.wheels[ROTOR_SLOT.MIDDLE].notch;
    const rightNotch =
      this.positions[ROTOR_SLOT.RIGHT] === this.wheels[ROTOR_SLOT.RIGHT].notch;
    const stepped = [middleNotch, middleNotch || rightNotch, true];
    this.positions = this.positions.map((position, index) =>
      mod26(position + Number(stepped[index])),
    );
    return stepped;
  }

  private passRotor(input: number, slot: RotorSlot, wiring: number[]): number {
    const offset = this.positions[slot] - this.ringOffsets[slot];
    return mod26(wiring[mod26(input + offset)] - offset);
  }

  /** Current-state transform; deliberately does not step. */
  scramble(input: number, path?: SignalStep[]): number {
    let letter = this.plugboard[input];
    const record = (label: string) =>
      path?.push({ label, letter: ALPHABET[letter] });
    record("Plugboard →");
    for (const slot of FORWARD_ROTOR_SLOTS) {
      letter = this.passRotor(letter, slot, this.wheels[slot].forward);
      record(`Rotor ${this.names[slot]} →`);
    }
    letter = this.reflector[letter];
    record("Reflector");
    for (const slot of ROTOR_SLOTS) {
      letter = this.passRotor(letter, slot, this.wheels[slot].reverse);
      record(`Rotor ${this.names[slot]} ←`);
    }
    letter = this.plugboard[letter];
    record("Plugboard ←");
    record("Lamp");
    return letter;
  }

  press(input: string): Trace {
    if (!/^[A-Z]$/.test(input)) throw new Error("Press one letter A–Z.");
    const before = this.windows;
    const stepped = this.step();
    const path = [{ label: "Key", letter: input }];
    const output = ALPHABET[this.scramble(ALPHABET.indexOf(input), path)];
    return { input, output, before, after: this.windows, stepped, path };
  }

  process(text: string): string {
    if (!/^[A-Z]*$/.test(text))
      throw new Error("Cipher input must contain only A–Z.");
    return [...text].map((letter) => this.press(letter).output).join("");
  }
}
