import { solveMenu } from "./plugboard-solver.ts";
import type { Solution } from "./plugboard-solver.ts";
import { buildMenu } from "./crib-menu.ts";
import type { MenuEdge, ScramblerEdge } from "./crib-menu.ts";
import {
  ALPHABET,
  ALPHABET_SIZE,
  Enigma,
  MAX_PLUGBOARD_PAIRS,
  ROTOR_NAMES,
  WINDOW_SETTING_COUNT,
  validateConfig,
} from "./enigma.ts";
import type { MachineConfig, RotorName, Triple } from "./enigma.ts";

// Preserve the existing engine entry points for callers.
export { solveMenu } from "./plugboard-solver.ts";
export type { Solution } from "./plugboard-solver.ts";
export { buildMenu } from "./crib-menu.ts";
export type { MenuEdge, ScramblerEdge } from "./crib-menu.ts";

export const MAX_CIPHERTEXT_LENGTH = 500;
export const MAX_CRIB_LENGTH = 100;
export const DEFAULT_RESULT_LIMIT = 50;
const PROGRESS_UPDATE_INTERVAL = 128;
const RIGHT_TWO_ROTOR_SETTING_COUNT = ALPHABET_SIZE ** 2;

export interface SearchOptions {
  config: MachineConfig;
  ciphertext: string;
  crib: string;
  offset: number;
  allOrders: boolean;
  maxPairs: number;
  resultLimit?: number;
}
export interface Candidate {
  rotors: Triple<RotorName>;
  windows: string;
  pairs: string[];
  unknown: string[];
  plaintext: string;
}
export interface SearchUpdate {
  tested: number;
  total: number;
  unresolved: number;
  candidates: Candidate[];
  current: string;
  reason: "running" | "complete" | "limit";
}

/** Exact Enigma stepping, including all characters before the crib. Cache belongs to one order/ring configuration. */
export function scramblerEdges(
  config: MachineConfig,
  menu: MenuEdge[],
  cache = new Map<string, Uint8Array>(),
): ScramblerEdge[] {
  const enigma = new Enigma({ ...config, plugs: "" });
  let position = -1;
  return menu.map((edge) => {
    while (position < edge.position) {
      enigma.step();
      position++;
    }
    const windows = enigma.windows;
    let mapping = cache.get(windows);
    if (!mapping) {
      mapping = Uint8Array.from({ length: ALPHABET_SIZE }, (_, input) =>
        enigma.scramble(input),
      );
      cache.set(windows, mapping);
    }
    return { ...edge, mapping };
  });
}

export function rotorOrders(): Triple<RotorName>[] {
  return ROTOR_NAMES.flatMap((a) =>
    ROTOR_NAMES.filter((b) => b !== a).flatMap((b) =>
      ROTOR_NAMES.filter((c) => c !== a && c !== b).map(
        (c) => [a, b, c] as Triple<RotorName>,
      ),
    ),
  );
}

export function searchSize(allOrders: boolean): number {
  return (allOrders ? rotorOrders().length : 1) * WINDOW_SETTING_COUNT;
}

function prepareSearchMenu(options: SearchOptions): MenuEdge[] {
  validateConfig(options.config);
  if (
    !Number.isInteger(options.maxPairs) ||
    options.maxPairs < 0 ||
    options.maxPairs > MAX_PLUGBOARD_PAIRS
  )
    throw new Error(
      `Maximum cables must be between 0 and ${MAX_PLUGBOARD_PAIRS}.`,
    );
  const menu = buildMenu(options.ciphertext, options.crib, options.offset);
  if (
    options.ciphertext.length > MAX_CIPHERTEXT_LENGTH ||
    options.crib.length > MAX_CRIB_LENGTH
  )
    throw new Error(
      `Use up to ${MAX_CIPHERTEXT_LENGTH} ciphertext letters and ${MAX_CRIB_LENGTH} crib letters.`,
    );
  return menu;
}

function windowsAt(index: number): string {
  return (
    ALPHABET[Math.floor(index / RIGHT_TWO_ROTOR_SETTING_COUNT)] +
    ALPHABET[Math.floor(index / ALPHABET_SIZE) % ALPHABET_SIZE] +
    ALPHABET[index % ALPHABET_SIZE]
  );
}

/** Replay the witness plugboard before exposing a candidate to callers. */
function verifyCandidate(
  config: MachineConfig,
  solution: Extract<Solution, { status: "match" }>,
  options: SearchOptions,
): Candidate {
  const plaintext = new Enigma({
    ...config,
    plugs: solution.pairs.join(" "),
  }).process(options.ciphertext);
  if (
    plaintext.slice(options.offset, options.offset + options.crib.length) !==
    options.crib
  )
    throw new Error("Candidate verification failed. Search stopped.");
  return {
    rotors: [...config.rotors],
    windows: config.windows,
    pairs: solution.pairs,
    unknown: solution.unknown,
    plaintext,
  };
}

export function* searchBombe(options: SearchOptions): Generator<SearchUpdate> {
  const menu = prepareSearchMenu(options);
  const orders = options.allOrders ? rotorOrders() : [options.config.rotors];
  const resultLimit = options.resultLimit ?? DEFAULT_RESULT_LIMIT;
  const update: SearchUpdate = {
    tested: 0,
    total: searchSize(options.allOrders),
    unresolved: 0,
    candidates: [],
    current: "",
    reason: "running",
  };
  for (const rotors of orders) {
    const cache = new Map<string, Uint8Array>();
    for (let index = 0; index < WINDOW_SETTING_COUNT; index++) {
      const windows = windowsAt(index);
      const config = { ...options.config, rotors, windows, plugs: "" };
      const result = solveMenu(scramblerEdges(config, menu, cache), {
        maxPairs: options.maxPairs,
      });
      update.tested++;
      update.current = `${rotors.join("–")} / ${windows}`;
      if (result.status === "unresolved") update.unresolved++;
      if (result.status === "match") {
        update.candidates.push(verifyCandidate(config, result, options));
        if (update.candidates.length >= resultLimit) {
          yield {
            ...update,
            candidates: [...update.candidates],
            reason: "limit",
          };
          return;
        }
      }
      if (update.tested % PROGRESS_UPDATE_INTERVAL === 0)
        yield { ...update, candidates: [...update.candidates] };
    }
  }
  yield { ...update, candidates: [...update.candidates], reason: "complete" };
}
