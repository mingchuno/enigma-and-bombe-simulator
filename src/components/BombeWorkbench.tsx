import { cn } from "../lib/cn.ts";
import styles from "./BombeWorkbench.module.css";
import { useEffect, useState } from "react";
import type { MenuEdge } from "../engine/crib-menu.ts";
import {
  searchSize,
  MAX_CIPHERTEXT_LENGTH,
  MAX_CRIB_LENGTH,
  DEFAULT_RESULT_LIMIT,
} from "../engine/bombe.ts";
import { ALPHABET, MAX_PLUGBOARD_PAIRS } from "../engine/enigma.ts";
import { Configuration } from "./Configuration.tsx";
import { CribAlignment } from "./CribAlignment.tsx";
import { DrumMechanics } from "./DrumMechanics.tsx";
import type {
  SearchDraft,
  SearchExercise,
} from "../workbench/search-exercise.ts";
import { useBombeSearch } from "./useBombeSearch.ts";
import { BombeResults } from "./BombeResults.tsx";

import { ConfigurationHelp, Help } from "./Help.tsx";
import { MuseumMenu } from "./MuseumMenu.tsx";
import { HistoricalMenu } from "./HistoricalMenu.tsx";
import { Icon } from "./Icon.tsx";
import { MenuGraph } from "./MenuGraph.tsx";
import { PaperMethods } from "./PaperMethods.tsx";

import { RAW_MESSAGE_INPUT_LIMIT } from "./message-input.ts";

const MIN_RECOMMENDED_CRIB_LENGTH = 8;
export function BombeWorkbench({
  transfer,
}: {
  transfer: SearchExercise | null;
}) {
  const [drumExample, setDrumExample] = useState<{
    edges: MenuEdge[];
    selected: number;
  } | null>(null);
  const [mode, setMode] = useState<"search" | "drums" | "paper" | "museum">(
    "search",
  );
  const [menuView, setMenuView] = useState<"graph" | "historical">("graph");
  const [selectedEdge, setSelectedEdge] = useState(0);
  const search = useBombeSearch(transfer);
  const { config, ciphertext, crib, offset, allOrders, maxPairs } =
    search.draft;
  const { menu, isDemo } = search;
  const { progress, status, error } = search.snapshot;
  const running = status === "running";

  useEffect(() => {
    if (!transfer) return;
    setMode("search");
    setDrumExample(null);
    setSelectedEdge(0);
  }, [transfer]);

  function changeSearch(patch: Partial<SearchDraft>) {
    setDrumExample(null);
    setSelectedEdge(0);
    search.change(patch);
  }
  function loadDemo() {
    setDrumExample(null);
    setSelectedEdge(0);
    search.loadDemo();
  }
  const edge = menu.edges[Math.min(selectedEdge, menu.edges.length - 1)];
  const total = status === "idle" ? searchSize(allOrders) : progress.total;

  return (
    <>
      <div className={styles.modeSwitch} aria-label="Bombe activity">
        <button
          aria-pressed={mode === "search"}
          onClick={() => setMode("search")}
        >
          Crib & search
        </button>
        <button
          aria-pressed={mode === "drums"}
          onClick={() => setMode("drums")}
        >
          Drums & wiring
        </button>
        <button
          aria-pressed={mode === "paper"}
          onClick={() => setMode("paper")}
        >
          Paper methods
        </button>
        <button
          aria-pressed={mode === "museum"}
          onClick={() => setMode("museum")}
        >
          Museum example
        </button>
      </div>
      {mode === "museum" && (
        <MuseumMenu
          onIllustrate={(edges, selected) => {
            setDrumExample({ edges, selected });
            setMode("drums");
          }}
        />
      )}
      {mode === "drums" &&
        ((drumExample?.edges.length ?? menu.edges.length) ? (
          <>
            <p className={styles.fieldHint}>
              {drumExample
                ? "Illustrating the supplied museum menu; this does not change the search."
                : "Illustrating the current crib menu with the selected rotor types and reflector."}{" "}
              {drumExample && (
                <button
                  className={styles.textButton}
                  onClick={() => setDrumExample(null)}
                >
                  Use current crib instead
                </button>
              )}
            </p>
            <DrumMechanics
              config={config}
              edges={drumExample?.edges ?? menu.edges}
              selected={drumExample?.selected ?? selectedEdge}
              onSelect={(index) =>
                drumExample
                  ? setDrumExample({ ...drumExample, selected: index })
                  : setSelectedEdge(index)
              }
            />
          </>
        ) : (
          <p className={styles.errorMessage}>
            Set a valid crib alignment in Crib & search before exploring the
            drum connections.
          </p>
        ))}
      {mode === "paper" && <PaperMethods />}
      <div hidden={mode !== "search"}>
        <div className={styles.bombeGrid}>
          <div className={styles.bombeInputs}>
            <section className={styles.interceptPanel}>
              <div className={styles.sectionHeading}>
                <h2>The intercept</h2>
                <button
                  className={styles.textButton}
                  onClick={loadDemo}
                  disabled={running}
                >
                  <Icon name="reset" size={15} />
                  Load example
                </button>
              </div>
              <p className={styles.muted}>
                Start with ciphertext and a fragment of suspected plaintext.
              </p>
              <label>
                Ciphertext{" "}
                <span>
                  {ciphertext.length} / {MAX_CIPHERTEXT_LENGTH}
                </span>
                <textarea
                  aria-label="Intercepted ciphertext"
                  value={ciphertext}
                  maxLength={RAW_MESSAGE_INPUT_LIMIT}
                  disabled={running}
                  onChange={(e) => changeSearch({ ciphertext: e.target.value })}
                  spellCheck={false}
                />
              </label>
              <label>
                Crib <span>1–{MAX_CRIB_LENGTH} letters</span>
                <input
                  aria-label="Plaintext crib"
                  aria-describedby={
                    crib.length > 0 && crib.length < MIN_RECOMMENDED_CRIB_LENGTH
                      ? "short-crib-hint"
                      : undefined
                  }
                  value={crib}
                  disabled={running}
                  onChange={(e) => changeSearch({ crib: e.target.value })}
                  spellCheck={false}
                />
              </label>
              {crib.length > 0 && crib.length < MIN_RECOMMENDED_CRIB_LENGTH && (
                <p className={styles.fieldHint} id="short-crib-hint">
                  Short cribs usually produce many possible settings. Try a
                  longer crib to narrow the results. Searches stop after{" "}
                  {DEFAULT_RESULT_LIMIT} candidates.
                </p>
              )}
              <div className={styles.offsetControl}>
                <label>
                  Crib offset
                  <input
                    aria-label="Crib offset"
                    aria-invalid={Boolean(menu.error)}
                    aria-describedby={menu.error ? "crib-error" : undefined}
                    type="number"
                    min="0"
                    max={Math.max(0, ciphertext.length - crib.length)}
                    value={offset}
                    disabled={running}
                    onChange={(e) => {
                      changeSearch({ offset: Number(e.target.value) });
                    }}
                  />
                </label>
                <p>
                  0 starts at the first letter.
                  <br />
                  Move the crib to test another alignment.
                </p>
              </div>
              <CribAlignment
                ciphertext={ciphertext}
                crib={crib}
                offset={offset}
                disabled={running}
                onOffset={(value) => {
                  changeSearch({ offset: value });
                }}
              />
              <div className={styles.helpRow}>
                <Help term="Ciphertext and crib">
                  Ciphertext is the intercepted encrypted message. A crib is a
                  guess about some original words, such as a weather-report
                  phrase. It is evidence to test, not a known key. The search
                  assumes every crib letter is right at the chosen offset.
                </Help>
                <Help term="Crib offset">
                  Where the guessed words start in the intercepted message,
                  counted from zero. Offset 3 skips three ciphertext letters.
                  Sliding the crib only filters out impossible alignments; it
                  does not discover a key.
                </Help>
              </div>
              {menu.error && (
                <p id="crib-error" className={styles.errorMessage} role="alert">
                  {menu.error}
                </p>
              )}
              {isDemo && (
                <details className={styles.demoNote}>
                  <summary>About this generated example</summary>
                  <p>
                    Weather forecast crib, generated with I–II–III, rings AAA,
                    reflector B, start AAF, and plugs AV BS CG DL. The search
                    receives no starting windows or plug pairs.
                  </p>
                </details>
              )}
            </section>
            <section
              className={styles.searchSettings}
              data-configuration="search"
            >
              <h2>Set the search</h2>
              <p className={styles.muted}>
                Ring settings and reflector are known. Starting windows and
                plugboard are unknown.
              </p>
              <Configuration
                config={config}
                onChange={(next) => {
                  changeSearch({ config: next });
                }}
                disabled={running}
                showWindows={false}
              />
              <ConfigurationHelp />
              <div className={styles.searchFields}>
                <label>
                  Rotor orders
                  <select
                    aria-label="Rotor orders to search"
                    disabled={running}
                    value={allOrders ? "all" : "selected"}
                    onChange={(e) => {
                      changeSearch({ allOrders: e.target.value === "all" });
                    }}
                  >
                    <option value="selected">Selected order</option>
                    <option value="all">All 60 orders</option>
                  </select>
                </label>
                <label>
                  Reflector
                  <select
                    aria-label="Bombe reflector"
                    disabled={running}
                    value={config.reflector}
                    onChange={(e) => {
                      changeSearch({
                        config: {
                          ...config,
                          reflector: e.target.value as "B" | "C",
                        },
                      });
                    }}
                  >
                    <option>B</option>
                    <option>C</option>
                  </select>
                </label>
                <label>
                  Maximum cables
                  <select
                    aria-label="Maximum plugboard cables"
                    disabled={running}
                    value={maxPairs}
                    onChange={(e) => {
                      changeSearch({ maxPairs: Number(e.target.value) });
                    }}
                  >
                    {Array.from({ length: MAX_PLUGBOARD_PAIRS + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? "0 · no plugboard" : `At most ${i}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Help term="Maximum cables and unknown settings">
                A cable exchanges a pair of letters. At most 4 allows zero
                through four pairs, not exactly four. Starting windows and pairs
                are searched; rings and reflector are held fixed. A candidate
                only satisfies the supplied crib and may not be the original
                key.
              </Help>
              <div className={styles.searchSpace}>
                <strong>{searchSize(allOrders).toLocaleString()}</strong>
                <span>rotor positions to test</span>
              </div>
              <button
                className={cn(styles.primaryButton, styles.searchButton, {
                  [styles.cancelButton]: running,
                })}
                disabled={!running && Boolean(menu.error)}
                onClick={running ? search.stop : search.start}
              >
                <Icon name={running ? "close" : "play"} />
                {running ? "Stop search" : "Run Bombe search"}
              </button>
              <p className={styles.searchLimit}>
                Shows one compatible plugboard per setting. Stops after{" "}
                {DEFAULT_RESULT_LIMIT} candidates. Use a longer crib to narrow
                the results.
              </p>
              {error && (
                <p className={styles.errorMessage} role="alert">
                  {error}
                </p>
              )}
            </section>
          </div>
          <div className={styles.bombeAnalysis}>
            <section className={styles.menuPanel}>
              <div className={styles.sectionHeading}>
                <h2>The crib menu</h2>
                <span
                  className={cn(styles.validationBadge, {
                    [styles.invalid]: menu.error,
                  })}
                >
                  {menu.error ? "Check alignment" : "Alignment possible"}
                </span>
              </div>
              <p className={styles.muted}>
                The connection graph updates with your crib, ciphertext, and
                alignment. Letters are nodes; each plaintext–ciphertext pair
                connects them through the rotor state at that message position.
              </p>
              <div
                className={cn(styles.modeSwitch, styles.compact)}
                aria-label="Menu view"
              >
                <button
                  aria-pressed={menuView === "graph"}
                  onClick={() => setMenuView("graph")}
                >
                  Connection graph
                </button>
                <button
                  aria-pressed={menuView === "historical"}
                  onClick={() => setMenuView("historical")}
                >
                  Historical notation
                </button>
              </div>
              {menu.edges.length ? (
                <>
                  {menuView === "historical" ? (
                    <HistoricalMenu
                      edges={menu.edges}
                      selected={selectedEdge}
                      onSelect={setSelectedEdge}
                    />
                  ) : (
                    <MenuGraph
                      edges={menu.edges}
                      selected={selectedEdge}
                      onSelect={setSelectedEdge}
                    />
                  )}
                  <button
                    className={styles.textButton}
                    onClick={() => {
                      setDrumExample(null);
                      setMode("drums");
                    }}
                  >
                    See the current crib on the drums{" "}
                    <Icon name="arrow" size={15} />
                  </button>
                  {edge && (
                    <div className={styles.constraintEquation}>
                      <code>
                        P({ALPHABET[edge.b]}) = S<sub>{edge.position + 1}</sub>
                        (P(
                        {ALPHABET[edge.a]}))
                      </code>
                      <span>Current crib · position {edge.position + 1}</span>
                      <p>
                        P is the unknown plugboard. S is the rotor path at this
                        position. Pairings must agree across every connection.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.menuEmpty}>
                  A valid crib alignment will reveal the connection graph here.
                </div>
              )}
            </section>
            <BombeResults
              snapshot={search.snapshot}
              total={total}
              selectedCandidate={search.selectedCandidate}
              onSelect={search.selectCandidate}
            />
            <p className={styles.historicalNote}>
              <Icon name="book" />
              <span>
                This is a Bombe-inspired constraint search with exact Enigma
                stepping. Historical Bombes used drums, electrical circuits, and
                a diagonal board to detect potential stops.
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
