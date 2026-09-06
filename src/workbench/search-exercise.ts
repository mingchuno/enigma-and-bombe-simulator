import type { SearchOptions } from "../engine/bombe.ts";
import type { MachineConfig } from "../engine/enigma.ts";
import {
  DEFAULT_CONFIG,
  Enigma,
  MAX_PLUGBOARD_PAIRS,
} from "../engine/enigma.ts";

/** Message and known machine settings passed from enciphering to codebreaking. */
export interface SearchExercise {
  config: MachineConfig;
  ciphertext: string;
  crib: string;
}

export type SearchDraft = Omit<SearchOptions, "resultLimit">;

const DEMO_CONFIG: MachineConfig = {
  ...DEFAULT_CONFIG,
  windows: "AAF",
  plugs: "AV BS CG DL",
};
const DEMO_PLAIN = "WETTERVORHERSAGEFUERDIEBISKAYA";
const DEMO_CIPHER = new Enigma(DEMO_CONFIG).process(DEMO_PLAIN);
const DEMO_MAX_PAIRS = DEMO_CONFIG.plugs.split(" ").length;

export function searchFromExercise(exercise: SearchExercise): SearchDraft {
  return {
    config: {
      ...exercise.config,
      rotors: [...exercise.config.rotors],
      // Starting windows and plug pairs are unknown to the search.
      windows: DEFAULT_CONFIG.windows,
      plugs: "",
    },
    ciphertext: exercise.ciphertext,
    crib: exercise.crib,
    offset: 0,
    allOrders: false,
    maxPairs: MAX_PLUGBOARD_PAIRS,
  };
}

export function createDemoSearch(): SearchDraft {
  return {
    ...searchFromExercise({
      config: DEFAULT_CONFIG,
      ciphertext: DEMO_CIPHER,
      crib: DEMO_PLAIN,
    }),
    maxPairs: DEMO_MAX_PAIRS,
  };
}
