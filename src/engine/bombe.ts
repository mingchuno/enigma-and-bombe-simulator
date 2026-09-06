import { ALPHABET, Enigma, ROTOR_NAMES, validateConfig } from "./enigma.ts";
import type { MachineConfig, RotorName, Triple } from "./enigma.ts";

export interface MenuEdge {
  a: number;
  b: number;
  position: number;
}
export interface ScramblerEdge extends MenuEdge {
  mapping: ArrayLike<number>;
}
interface SolverOptions {
  maxPairs: number;
  alphabetSize?: number;
  branchLimit?: number;
}
export type Solution =
  | {
      status: "match";
      mapping: number[];
      pairs: string[];
      unknown: string[];
      branches: number;
    }
  | { status: "reject" | "unresolved"; branches: number };
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

export function buildMenu(
  ciphertext: string,
  crib: string,
  offset: number,
): MenuEdge[] {
  if (!/^[A-Z]+$/.test(ciphertext) || !/^[A-Z]+$/.test(crib))
    throw new Error("Enter ciphertext and a crib using A–Z.");
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset + crib.length > ciphertext.length
  ) {
    throw new Error("The crib must fit inside the ciphertext at this offset.");
  }
  return [...crib].map((letter, index) => {
    const position = index + offset;
    if (letter === ciphertext[position])
      throw new Error(
        `At position ${position + 1}, ${letter} would encrypt to itself. Move or change the crib.`,
      );
    return {
      a: ALPHABET.indexOf(letter),
      b: ALPHABET.indexOf(ciphertext[position]),
      position,
    };
  });
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
      mapping = Uint8Array.from({ length: 26 }, (_, input) =>
        enigma.scramble(input),
      );
      cache.set(windows, mapping);
    }
    return { ...edge, mapping };
  });
}

/** Partial involution propagation + backtracking, not an electrical stop detector. */
export function solveMenu(
  edges: ScramblerEdge[],
  options: SolverOptions,
): Solution {
  const size = options.alphabetSize ?? 26;
  const branchLimit = options.branchLimit ?? 20000;
  const adjacency: ScramblerEdge[][] = Array.from({ length: size }, () => []);
  edges.forEach((edge) => {
    adjacency[edge.a].push(edge);
    adjacency[edge.b].push(edge);
  });
  const letters = Array.from({ length: size }, (_, i) => i)
    .filter((i) => adjacency[i].length)
    .sort((a, b) => adjacency[b].length - adjacency[a].length);
  let branches = 0;
  let exhausted = false;

  function propagate(mapping: number[], initial: [number, number]): boolean {
    const queue = [initial];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const [a, b] = queue[cursor];
      if (mapping[a] !== -1) {
        if (mapping[a] !== b) return false;
        continue;
      }
      if (mapping[b] !== -1 && mapping[b] !== a) return false;
      mapping[a] = b;
      mapping[b] = a;
      let pairCount = 0;
      for (let i = 0; i < size; i++) if (mapping[i] > i) pairCount++;
      if (pairCount > options.maxPairs) return false;
      for (const letter of new Set([a, b])) {
        for (const edge of adjacency[letter]) {
          const other = edge.a === letter ? edge.b : edge.a;
          queue.push([other, edge.mapping[mapping[letter]]]);
        }
      }
    }
    return true;
  }

  function branch(mapping: number[]): number[] | undefined {
    const letter = letters.find((value) => mapping[value] === -1);
    if (letter === undefined) return mapping;
    // Try self-steckering first; it is a valid hypothesis, not a known fact.
    const partners = [
      letter,
      ...Array.from({ length: size }, (_, i) => i).filter((i) => i !== letter),
    ];
    for (const partner of partners) {
      if (mapping[partner] !== -1) continue;
      if (branches >= branchLimit) {
        exhausted = true;
        return;
      }
      branches++;
      const next = [...mapping];
      if (!propagate(next, [letter, partner])) continue;
      const result = branch(next);
      if (result) return result;
      if (exhausted) return;
    }
  }

  const mapping = branch(Array(size).fill(-1));
  if (!mapping)
    return { status: exhausted ? "unresolved" : "reject", branches };
  const pairs = mapping.flatMap((partner, letter) =>
    partner > letter ? [ALPHABET[letter] + ALPHABET[partner]] : [],
  );
  const unknown = mapping.flatMap((partner, letter) =>
    partner === -1 ? [ALPHABET[letter]] : [],
  );
  return { status: "match", mapping, pairs, unknown, branches };
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

export function* searchBombe(options: SearchOptions): Generator<SearchUpdate> {
  validateConfig(options.config);
  if (
    !Number.isInteger(options.maxPairs) ||
    options.maxPairs < 0 ||
    options.maxPairs > 13
  )
    throw new Error("Maximum cables must be between 0 and 13.");
  const menu = buildMenu(options.ciphertext, options.crib, options.offset);
  if (options.crib.length < 8)
    throw new Error(
      "Use a crib of at least 8 letters; longer cribs reduce ambiguous matches.",
    );
  if (options.ciphertext.length > 500 || options.crib.length > 100)
    throw new Error("Use up to 500 ciphertext letters and 100 crib letters.");
  const orders = options.allOrders ? rotorOrders() : [options.config.rotors];
  const resultLimit = options.resultLimit ?? 50;
  const update: SearchUpdate = {
    tested: 0,
    total: orders.length * 17576,
    unresolved: 0,
    candidates: [],
    current: "",
    reason: "running",
  };
  for (const rotors of orders) {
    const cache = new Map<string, Uint8Array>();
    for (let index = 0; index < 17576; index++) {
      const windows =
        ALPHABET[Math.floor(index / 676)] +
        ALPHABET[Math.floor(index / 26) % 26] +
        ALPHABET[index % 26];
      const config = { ...options.config, rotors, windows, plugs: "" };
      const result = solveMenu(scramblerEdges(config, menu, cache), {
        maxPairs: options.maxPairs,
      });
      update.tested++;
      update.current = `${rotors.join("–")} / ${windows}`;
      if (result.status === "unresolved") update.unresolved++;
      if (result.status === "match") {
        const plaintext = new Enigma({
          ...config,
          plugs: result.pairs.join(" "),
        }).process(options.ciphertext);
        if (
          plaintext.slice(
            options.offset,
            options.offset + options.crib.length,
          ) !== options.crib
        )
          throw new Error("Candidate verification failed. Search stopped.");
        update.candidates.push({
          rotors: [...rotors],
          windows,
          pairs: result.pairs,
          unknown: result.unknown,
          plaintext,
        });
        if (update.candidates.length >= resultLimit) {
          yield {
            ...update,
            candidates: [...update.candidates],
            reason: "limit",
          };
          return;
        }
      }
      if (update.tested % 128 === 0)
        yield { ...update, candidates: [...update.candidates] };
    }
  }
  yield { ...update, candidates: [...update.candidates], reason: "complete" };
}
