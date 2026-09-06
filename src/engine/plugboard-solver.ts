import type { ScramblerEdge } from "./crib-menu.ts";
import { ALPHABET, ALPHABET_SIZE } from "./enigma.ts";

const DEFAULT_BRANCH_LIMIT = 20_000;
const UNASSIGNED_PARTNER = -1;

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

/** Partial involution propagation + backtracking, not an electrical stop detector. */
export function solveMenu(
  edges: ScramblerEdge[],
  options: SolverOptions,
): Solution {
  const size = options.alphabetSize ?? ALPHABET_SIZE;
  const branchLimit = options.branchLimit ?? DEFAULT_BRANCH_LIMIT;
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
      if (mapping[a] !== UNASSIGNED_PARTNER) {
        if (mapping[a] !== b) return false;
        continue;
      }
      if (mapping[b] !== UNASSIGNED_PARTNER && mapping[b] !== a) return false;
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
    const letter = letters.find(
      (value) => mapping[value] === UNASSIGNED_PARTNER,
    );
    if (letter === undefined) return mapping;
    // Try self-steckering first; it is a valid hypothesis, not a known fact.
    const partners = [
      letter,
      ...Array.from({ length: size }, (_, i) => i).filter((i) => i !== letter),
    ];
    for (const partner of partners) {
      if (mapping[partner] !== UNASSIGNED_PARTNER) continue;
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

  const mapping = branch(Array(size).fill(UNASSIGNED_PARTNER));
  if (!mapping)
    return { status: exhausted ? "unresolved" : "reject", branches };
  const pairs = mapping.flatMap((partner, letter) =>
    partner > letter ? [ALPHABET[letter] + ALPHABET[partner]] : [],
  );
  const unknown = mapping.flatMap((partner, letter) =>
    partner === UNASSIGNED_PARTNER ? [ALPHABET[letter]] : [],
  );
  return { status: "match", mapping, pairs, unknown, branches };
}
