import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { buildMenu } from "../engine/crib-menu.ts";
import { BombeSearchSession } from "../engine/bombe-session.ts";
import { MAX_CIPHERTEXT_LENGTH, MAX_CRIB_LENGTH } from "../engine/bombe.ts";
import { normalizeText } from "../engine/enigma.ts";
import type {
  SearchDraft,
  SearchExercise,
} from "../workbench/search-exercise.ts";
import {
  createDemoSearch,
  searchFromExercise,
} from "../workbench/search-exercise.ts";

/** Owns search assumptions and the lifetime of the results derived from them. */
export function useBombeSearch(transfer: SearchExercise | null) {
  const [draft, setDraft] = useState(createDemoSearch);
  const [isDemo, setIsDemo] = useState(true);
  const [selectedCandidate, selectCandidate] = useState(0);
  const [session] = useState(
    () =>
      new BombeSearchSession(
        () =>
          new Worker(new URL("../engine/bombe.worker.ts", import.meta.url), {
            type: "module",
          }),
      ),
  );
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);

  useEffect(() => () => session.dispose(), [session]);
  useEffect(() => {
    if (!transfer) return;
    session.reset();
    selectCandidate(0);
    setDraft(searchFromExercise(transfer));
    setIsDemo(false);
  }, [transfer, session]);

  const { ciphertext, crib, offset } = draft;
  const menu = useMemo(() => {
    try {
      return { edges: buildMenu(ciphertext, crib, offset), error: "" };
    } catch (problem) {
      return { edges: [], error: (problem as Error).message };
    }
  }, [ciphertext, crib, offset]);

  function change(patch: Partial<SearchDraft>) {
    session.reset();
    selectCandidate(0);
    setIsDemo(false);
    setDraft((previous) => ({
      ...previous,
      ...patch,
      ciphertext:
        patch.ciphertext === undefined
          ? previous.ciphertext
          : normalizeText(patch.ciphertext).slice(0, MAX_CIPHERTEXT_LENGTH),
      crib:
        patch.crib === undefined
          ? previous.crib
          : normalizeText(patch.crib).slice(0, MAX_CRIB_LENGTH),
    }));
  }

  function loadDemo() {
    session.reset();
    selectCandidate(0);
    setDraft(createDemoSearch());
    setIsDemo(true);
  }

  function start() {
    selectCandidate(0);
    session.start(draft);
  }

  return {
    draft,
    isDemo,
    menu,
    snapshot,
    selectedCandidate,
    selectCandidate,
    change,
    loadDemo,
    start,
    stop: () => session.stop(),
  };
}
