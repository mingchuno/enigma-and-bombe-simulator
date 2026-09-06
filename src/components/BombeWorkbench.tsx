import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { MenuEdge } from "../engine/bombe.ts";
import { BombeSearchSession } from "../engine/bombe-session.ts";
import { buildMenu, searchSize } from "../engine/bombe.ts";
import type { MachineConfig } from "../engine/enigma.ts";
import {
  ALPHABET,
  DEFAULT_CONFIG,
  Enigma,
  normalizeText,
} from "../engine/enigma.ts";
import { Configuration } from "./Configuration.tsx";
import { CribAlignment } from "./CribAlignment.tsx";
import { DrumMechanics } from "./DrumMechanics.tsx";
import type { Transfer } from "./EnigmaWorkbench.tsx";

import { ConfigurationHelp, Help } from "./Help.tsx";
import { MuseumMenu } from "./MuseumMenu.tsx";
import { HistoricalMenu } from "./HistoricalMenu.tsx";
import { Icon } from "./Icon.tsx";
import { MenuGraph } from "./MenuGraph.tsx";
import { PaperMethods } from "./PaperMethods.tsx";

const DEMO_CONFIG: MachineConfig = {
  ...DEFAULT_CONFIG,
  windows: "AAF",
  plugs: "AV BS CG DL",
};
const DEMO_PLAIN = "WETTERVORHERSAGEFUERDIEBISKAYA";
const DEMO_CIPHER = new Enigma(DEMO_CONFIG).process(DEMO_PLAIN);
export function BombeWorkbench({ transfer }: { transfer: Transfer | null }) {
  const [drumExample, setDrumExample] = useState<{
    edges: MenuEdge[];
    selected: number;
  } | null>(null);
  const [mode, setMode] = useState<"search" | "drums" | "paper" | "museum">(
    "search",
  );
  const [menuView, setMenuView] = useState<"graph" | "historical">("graph");
  const [config, setConfig] = useState<MachineConfig>(DEFAULT_CONFIG);
  const [ciphertext, setCiphertext] = useState(DEMO_CIPHER);
  const [crib, setCrib] = useState(DEMO_PLAIN);
  const [offset, setOffset] = useState(0);
  const [allOrders, setAllOrders] = useState(false);
  const [maxPairs, setMaxPairs] = useState(4);
  const [selectedEdge, setSelectedEdge] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(0);
  const [session] = useState(
    () =>
      new BombeSearchSession(
        () =>
          new Worker(new URL("../engine/bombe.worker.ts", import.meta.url), {
            type: "module",
          }),
      ),
  );
  const { progress, status, error, elapsed } = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
  );
  const [isDemo, setIsDemo] = useState(true);
  const running = status === "running";

  useEffect(() => () => session.dispose(), [session]);
  useEffect(() => {
    if (!transfer) return;
    session.reset();
    setMode("search");
    setDrumExample(null);
    setSelectedEdge(0);
    setConfig({ ...transfer.config, windows: "AAA", plugs: "" });
    setCiphertext(transfer.ciphertext);
    setCrib(transfer.crib);
    setOffset(0);
    setMaxPairs(13);
    setAllOrders(false);
    setSelectedCandidate(0);
    setIsDemo(false);
  }, [transfer, session]);

  const menu = useMemo(() => {
    try {
      return { edges: buildMenu(ciphertext, crib, offset), error: "" };
    } catch (problem) {
      return { edges: [], error: (problem as Error).message };
    }
  }, [ciphertext, crib, offset]);

  function invalidate() {
    session.reset();
    setDrumExample(null);
    setIsDemo(false);
    setSelectedEdge(0);
    setSelectedCandidate(0);
  }
  function loadDemo() {
    invalidate();
    setConfig(DEFAULT_CONFIG);
    setCiphertext(DEMO_CIPHER);
    setCrib(DEMO_PLAIN);
    setOffset(0);
    setMaxPairs(4);
    setAllOrders(false);
    setIsDemo(true);
  }
  function startSearch() {
    setSelectedCandidate(0);
    session.start({ config, ciphertext, crib, offset, allOrders, maxPairs });
  }
  function cancelSearch() {
    session.stop();
  }
  const candidate = progress.candidates[selectedCandidate];
  const edge = menu.edges[Math.min(selectedEdge, menu.edges.length - 1)];
  const total = status === "idle" ? searchSize(allOrders) : progress.total;
  const percentage = (progress.tested / total) * 100;

  return (
    <>
      <div className="mode-switch" aria-label="Bombe activity">
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
            <p className="field-hint">
              {drumExample
                ? "Illustrating the supplied museum menu; this does not change the search."
                : "Illustrating the current crib menu with the selected rotor types and reflector."}{" "}
              {drumExample && (
                <button
                  className="text-button"
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
          <p className="error-message">
            Set a valid crib alignment in Crib & search before exploring the
            drum connections.
          </p>
        ))}
      {mode === "paper" && <PaperMethods />}
      <div hidden={mode !== "search"}>
        <div className="bombe-grid">
          <div className="bombe-inputs">
            <section className="intercept-panel">
              <div className="section-heading">
                <h2>The intercept</h2>
                <button
                  className="text-button"
                  onClick={loadDemo}
                  disabled={running}
                >
                  <Icon name="reset" size={15} />
                  Load example
                </button>
              </div>
              <p className="muted">
                Start with ciphertext and a fragment of suspected plaintext.
              </p>
              <label>
                Ciphertext <span>{ciphertext.length} / 500</span>
                <textarea
                  aria-label="Intercepted ciphertext"
                  value={ciphertext}
                  maxLength={1000}
                  disabled={running}
                  onChange={(e) => {
                    invalidate();
                    setCiphertext(normalizeText(e.target.value).slice(0, 500));
                  }}
                  spellCheck={false}
                />
              </label>
              <label>
                Crib <span>1–100 letters</span>
                <input
                  aria-label="Plaintext crib"
                  aria-describedby={
                    crib.length > 0 && crib.length < 8
                      ? "short-crib-hint"
                      : undefined
                  }
                  value={crib}
                  disabled={running}
                  onChange={(e) => {
                    invalidate();
                    setCrib(normalizeText(e.target.value).slice(0, 100));
                  }}
                  spellCheck={false}
                />
              </label>
              {crib.length > 0 && crib.length < 8 && (
                <p className="field-hint" id="short-crib-hint">
                  Short cribs usually produce many possible settings. Try a
                  longer crib to narrow the results. Searches stop after 50
                  candidates.
                </p>
              )}
              <div className="offset-control">
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
                      invalidate();
                      setOffset(Number(e.target.value));
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
                  invalidate();
                  setOffset(value);
                }}
              />
              <div className="help-row">
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
                <p id="crib-error" className="error-message" role="alert">
                  {menu.error}
                </p>
              )}
              {isDemo && (
                <details className="demo-note">
                  <summary>About this generated example</summary>
                  <p>
                    Weather forecast crib, generated with I–II–III, rings AAA,
                    reflector B, start AAF, and plugs AV BS CG DL. The search
                    receives no starting windows or plug pairs.
                  </p>
                </details>
              )}
            </section>
            <section className="search-settings">
              <h2>Set the search</h2>
              <p className="muted">
                Ring settings and reflector are known. Starting windows and
                plugboard are unknown.
              </p>
              <Configuration
                config={config}
                onChange={(next) => {
                  invalidate();
                  setConfig(next);
                }}
                disabled={running}
                showWindows={false}
              />
              <ConfigurationHelp />
              <div className="search-fields">
                <label>
                  Rotor orders
                  <select
                    aria-label="Rotor orders to search"
                    disabled={running}
                    value={allOrders ? "all" : "selected"}
                    onChange={(e) => {
                      invalidate();
                      setAllOrders(e.target.value === "all");
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
                      invalidate();
                      setConfig({
                        ...config,
                        reflector: e.target.value as "B" | "C",
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
                      invalidate();
                      setMaxPairs(Number(e.target.value));
                    }}
                  >
                    {Array.from({ length: 14 }, (_, i) => (
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
              <div className="search-space">
                <strong>{searchSize(allOrders).toLocaleString()}</strong>
                <span>rotor positions to test</span>
              </div>
              <button
                className={`primary-button search-button ${running ? "cancel-button" : ""}`}
                disabled={!running && Boolean(menu.error)}
                onClick={running ? cancelSearch : startSearch}
              >
                <Icon name={running ? "close" : "play"} />
                {running ? "Stop search" : "Run Bombe search"}
              </button>
              <p className="search-limit">
                Shows one compatible plugboard per setting. Stops after 50
                candidates. Use a longer crib to narrow the results.
              </p>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
            </section>
          </div>
          <div className="bombe-analysis">
            <section className="menu-panel">
              <div className="section-heading">
                <h2>The crib menu</h2>
                <span
                  className={`validation-badge ${menu.error ? "invalid" : ""}`}
                >
                  {menu.error ? "Check alignment" : "Alignment possible"}
                </span>
              </div>
              <p className="muted">
                The connection graph updates with your crib, ciphertext, and
                alignment. Letters are nodes; each plaintext–ciphertext pair
                connects them through the rotor state at that message position.
              </p>
              <div className="mode-switch compact" aria-label="Menu view">
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
                    className="text-button"
                    onClick={() => {
                      setDrumExample(null);
                      setMode("drums");
                    }}
                  >
                    See the current crib on the drums{" "}
                    <Icon name="arrow" size={15} />
                  </button>
                  {edge && (
                    <div className="constraint-equation">
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
                <div className="menu-empty">
                  A valid crib alignment will reveal the connection graph here.
                </div>
              )}
            </section>
            <section className="results-panel">
              <Help term="Reading search results">
                Tested counts rotor orientations checked. A candidate is one
                plugboard assignment that passes the crib check, not a confirmed
                decryption. Unknown letters are left unplugged only for the
                preview. A stopped search or candidate limit leaves untested
                settings.
              </Help>
              <div className="section-heading">
                <h2>Search log</h2>
                <span
                  className={`search-status ${running ? "running" : ""}`}
                  role="status"
                >
                  {status === "idle"
                    ? "Ready"
                    : running
                      ? "Searching"
                      : status === "stopped"
                        ? "Stopped · partial search"
                        : status === "error"
                          ? "Search failed"
                          : progress.reason === "limit"
                            ? "Candidate limit reached · partial search"
                            : progress.unresolved
                              ? "Finished · unresolved settings"
                              : "Search complete"}
                </span>
              </div>
              <progress
                max={total}
                value={progress.tested}
                aria-label="Search progress"
              />
              <div className="progress-details">
                <span>
                  {progress.tested.toLocaleString()} / {total.toLocaleString()}{" "}
                  tested
                </span>
                <span>
                  {percentage.toFixed(1)}% checked <b>·</b> {elapsed.toFixed(1)}
                  s
                </span>
              </div>
              {progress.reason === "limit" && !running && (
                <p className="field-hint">
                  Stopped after finding {progress.candidates.length}{" "}
                  crib-compatible candidates.{" "}
                  {(total - progress.tested).toLocaleString()} settings remain
                  untested. The percentage measures search coverage, not
                  confidence. Use a longer crib or narrow the rotor orders, then
                  run again. Selecting a candidate shows its settings and a
                  decryption preview; a matching crib does not confirm the key.
                </p>
              )}
              {status === "idle" ? (
                <div className="results-empty">
                  <span className="search-glyph" aria-hidden="true">
                    ?
                  </span>
                  <div>
                    <h3>Find what the settings allow.</h3>
                    <p>
                      Run the search to test each starting position, propagate
                      plugboard pairings, and reject contradictions.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="run-summary">
                    <span>
                      Last checked{" "}
                      <code>{progress.current || "Preparing…"}</code>
                    </span>
                    <strong>
                      {progress.candidates.length}{" "}
                      {progress.candidates.length === 1
                        ? "candidate"
                        : "candidates"}
                    </strong>
                  </div>
                  {progress.unresolved > 0 && (
                    <p className="error-message">
                      {progress.unresolved} settings exceeded the per-setting
                      work budget. They are unresolved, not rejected.
                    </p>
                  )}
                  {!progress.candidates.length && !running && (
                    <p className="muted">
                      No candidates found in the settings tested. Check the
                      crib, offset, rings, reflector, and cable limit.
                    </p>
                  )}
                  {progress.candidates.length > 0 && (
                    <>
                      <div
                        className="candidate-tabs"
                        aria-label="Candidate settings"
                      >
                        {progress.candidates.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedCandidate(index)}
                            aria-pressed={index === selectedCandidate}
                            className={
                              index === selectedCandidate ? "selected" : ""
                            }
                          >
                            {result.windows}
                            <small>{result.rotors.join("–")}</small>
                          </button>
                        ))}
                      </div>
                      {candidate && (
                        <div className="candidate-detail">
                          <div className="section-heading">
                            <h3>Crib-compatible candidate</h3>
                            <span className="validation-badge">
                              Replay checked
                            </span>
                          </div>
                          <dl>
                            <div>
                              <dt>Start windows</dt>
                              <dd>{candidate.windows}</dd>
                            </div>
                            <div>
                              <dt>Rotor order</dt>
                              <dd>{candidate.rotors.join("–")}</dd>
                            </div>
                            <div>
                              <dt>Plug pairs</dt>
                              <dd>
                                {candidate.pairs.join(" ") ||
                                  "No cables in this assignment"}
                              </dd>
                            </div>
                          </dl>
                          <p className="candidate-plaintext">
                            {candidate.plaintext}
                          </p>
                          <p className="muted">
                            {candidate.unknown.length
                              ? `Unresolved letters: ${candidate.unknown.join(" ")}. They are treated as unplugged in this preview; other completions may exist.`
                              : "This candidate assigns all 26 letters; other compatible assignments may exist."}{" "}
                            These are compatible pairings, not proven original
                            wiring. A matching crib does not prove that this is
                            the original key.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
            <p className="historical-note">
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
