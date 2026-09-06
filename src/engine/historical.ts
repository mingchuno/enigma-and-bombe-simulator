import type { MenuEdge, ScramblerEdge } from "./bombe.ts";
import type { MachineConfig, Triple } from "./enigma.ts";
import { ALPHABET, Enigma, mod26 } from "./enigma.ts";

// Discrete sense/carry model of a 39-point Bombe. See historical-bombe-interfaces.md.
export function driveState(point: number) {
  const tick = Math.max(0, Math.floor(point)) % (39 * 26 * 26);
  const cycle = Math.floor(tick / 39);
  const phase = tick % 39;
  return {
    phase,
    sensing: phase < 26,
    tested: cycle * 26 + Math.min(phase + 1, 26),
    cores: [
      tick % 26,
      cycle % 26,
      Math.floor(cycle / 26) % 26,
    ] as Triple<number>,
  };
}

/** Position is zero-based. Beyond one revolution, avoid inventing an Enigma carry. */
export function relativeLabel(position: number): string {
  return position < 26 ? `ZZ${ALPHABET[position]}` : `+${position + 1}`;
}

export function historicalScramblers(
  config: MachineConfig,
  edges: MenuEdge[],
  point: number,
) {
  const { cores } = driveState(point);
  return edges.map((edge) => {
    const positions = [...cores];
    positions[2] = mod26(positions[2] + edge.position + 1);
    const windows = positions.map((value) => ALPHABET[value]).join("");
    // Core coordinates, not actual window/ring settings or printed Bombe drum letters.
    const enigma = new Enigma({ ...config, windows, rings: "AAA", plugs: "" });
    const mapping = Array.from({ length: 26 }, (_, input) =>
      enigma.scramble(input),
    );
    return { ...edge, mapping, windows };
  });
}

export function electricalReachability(
  edges: ScramblerEdge[],
  register: number,
  hypothesis: number,
  diagonal: boolean,
) {
  const adjacency = Array.from({ length: 26 }, () => [] as ScramblerEdge[]);
  for (const edge of edges) {
    adjacency[edge.a].push(edge);
    adjacency[edge.b].push(edge);
  }
  const live = Array<boolean>(676).fill(false);
  const queue = [register * 26 + hypothesis];
  live[queue[0]] = true;
  const activate = (terminal: number) => {
    if (!live[terminal]) {
      live[terminal] = true;
      queue.push(terminal);
    }
  };
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const terminal = queue[cursor];
    const letter = Math.floor(terminal / 26);
    const wire = terminal % 26;
    if (diagonal) activate(wire * 26 + letter);
    for (const edge of adjacency[letter]) {
      const other = edge.a === letter ? edge.b : edge.a;
      activate(other * 26 + edge.mapping[wire]);
    }
  }
  const registerCount = live
    .slice(register * 26, register * 26 + 26)
    .filter(Boolean).length;
  return { live, registerCount, energized: queue.length };
}

export function compareStrips(first: string, second: string, shift: number) {
  const matches: number[] = [];
  let overlap = 0;
  for (let index = 0; index < first.length; index++) {
    const other = index - shift;
    if (other < 0 || other >= second.length) continue;
    overlap++;
    if (first[index] === second[other]) matches.push(index);
  }
  return { matches, overlap };
}

// Facts transcribed from the user's supplied menu, including the parallel G–R edges.
export const EXHIBIT_MENU: MenuEdge[] = [
  ["S", "W", 1],
  ["N", "E", 2],
  ["G", "E", 5],
  ["G", "R", 6],
  ["V", "S", 7],
  ["Z", "R", 9],
  ["H", "Z", 10],
  ["E", "U", 11],
  ["G", "R", 12],
  ["A", "S", 13],
  ["R", "A", 14],
  ["L", "G", 15],
  ["E", "V", 16],
].map(([a, b, position]) => ({
  a: ALPHABET.indexOf(String(a)),
  b: ALPHABET.indexOf(String(b)),
  position: Number(position) - 1,
}));
