import type { MenuEdge, ScramblerEdge } from "./crib-menu.ts";
import type { MachineConfig, Triple } from "./enigma.ts";
import {
  ALPHABET,
  ALPHABET_SIZE,
  Enigma,
  ROTOR_SLOT,
  mod26,
} from "./enigma.ts";

export const SENSING_POINTS = ALPHABET_SIZE;
export const CARRY_POINTS = 13;
export const DRIVE_POINTS_PER_CYCLE = SENSING_POINTS + CARRY_POINTS;
export const DRIVE_POINT_COUNT = DRIVE_POINTS_PER_CYCLE * ALPHABET_SIZE ** 2;
export const DIAGONAL_BOARD_TERMINAL_COUNT = ALPHABET_SIZE ** 2;
export const SCRAMBLERS_PER_CHAIN = 12;

// Discrete sense/carry model of a 39-point Bombe. See historical-bombe-interfaces.md.
export function driveState(point: number) {
  const tick = Math.max(0, Math.floor(point)) % DRIVE_POINT_COUNT;
  const cycle = Math.floor(tick / DRIVE_POINTS_PER_CYCLE);
  const phase = tick % DRIVE_POINTS_PER_CYCLE;
  return {
    phase,
    sensing: phase < SENSING_POINTS,
    tested: cycle * SENSING_POINTS + Math.min(phase + 1, SENSING_POINTS),
    cores: [
      tick % ALPHABET_SIZE,
      cycle % ALPHABET_SIZE,
      Math.floor(cycle / ALPHABET_SIZE) % ALPHABET_SIZE,
    ] as Triple<number>,
  };
}

/** Position is zero-based. Beyond one revolution, avoid inventing an Enigma carry. */
export function relativeLabel(position: number): string {
  return position < ALPHABET_SIZE
    ? `ZZ${ALPHABET[position]}`
    : `+${position + 1}`;
}

export function historicalScramblers(
  config: MachineConfig,
  edges: MenuEdge[],
  point: number,
) {
  const { cores } = driveState(point);
  return edges.map((edge) => {
    const positions = [...cores];
    positions[ROTOR_SLOT.RIGHT] = mod26(
      positions[ROTOR_SLOT.RIGHT] + edge.position + 1,
    );
    const windows = positions.map((value) => ALPHABET[value]).join("");
    // Core coordinates, not actual window/ring settings or printed Bombe drum letters.
    const enigma = new Enigma({ ...config, windows, rings: "AAA", plugs: "" });
    const mapping = Array.from({ length: ALPHABET_SIZE }, (_, input) =>
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
  const adjacency = Array.from(
    { length: ALPHABET_SIZE },
    () => [] as ScramblerEdge[],
  );
  for (const edge of edges) {
    adjacency[edge.a].push(edge);
    adjacency[edge.b].push(edge);
  }
  const live = Array<boolean>(DIAGONAL_BOARD_TERMINAL_COUNT).fill(false);
  const queue = [register * ALPHABET_SIZE + hypothesis];
  live[queue[0]] = true;
  const activate = (terminal: number) => {
    if (!live[terminal]) {
      live[terminal] = true;
      queue.push(terminal);
    }
  };
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const terminal = queue[cursor];
    const letter = Math.floor(terminal / ALPHABET_SIZE);
    const wire = terminal % ALPHABET_SIZE;
    if (diagonal) activate(wire * ALPHABET_SIZE + letter);
    for (const edge of adjacency[letter]) {
      const other = edge.a === letter ? edge.b : edge.a;
      activate(other * ALPHABET_SIZE + edge.mapping[wire]);
    }
  }
  const registerCount = live
    .slice(register * ALPHABET_SIZE, register * ALPHABET_SIZE + ALPHABET_SIZE)
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
