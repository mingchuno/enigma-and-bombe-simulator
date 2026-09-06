import type { SearchSnapshot } from "../engine/bombe-session.ts";
import { Help } from "./Help.tsx";

const PERCENT_SCALE = 100;
const PROGRESS_DECIMAL_PLACES = 1;

export function BombeResults({
  snapshot,
  total,
  selectedCandidate,
  onSelect,
}: {
  snapshot: SearchSnapshot;
  total: number;
  selectedCandidate: number;
  onSelect: (index: number) => void;
}) {
  const { progress, status, elapsed } = snapshot;
  const running = status === "running";
  const percentage = (progress.tested / total) * PERCENT_SCALE;
  const candidate = progress.candidates[selectedCandidate];
  return (
    <section className="results-panel">
      <Help term="Reading search results">
        Tested counts rotor orientations checked. A candidate is one plugboard
        assignment that passes the crib check, not a confirmed decryption.
        Unknown letters are left unplugged only for the preview. A stopped
        search or candidate limit leaves untested settings.
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
          {progress.tested.toLocaleString()} / {total.toLocaleString()} tested
        </span>
        <span>
          {percentage.toFixed(PROGRESS_DECIMAL_PLACES)}% checked <b>·</b>{" "}
          {elapsed.toFixed(PROGRESS_DECIMAL_PLACES)}s
        </span>
      </div>
      {progress.reason === "limit" && !running && (
        <p className="field-hint">
          Stopped after finding {progress.candidates.length} crib-compatible
          candidates. {(total - progress.tested).toLocaleString()} settings
          remain untested. The percentage measures search coverage, not
          confidence. Use a longer crib or narrow the rotor orders, then run
          again. Selecting a candidate shows its settings and a decryption
          preview; a matching crib does not confirm the key.
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
              Run the search to test each starting position, propagate plugboard
              pairings, and reject contradictions.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="run-summary">
            <span>
              Last checked <code>{progress.current || "Preparing…"}</code>
            </span>
            <strong>
              {progress.candidates.length}{" "}
              {progress.candidates.length === 1 ? "candidate" : "candidates"}
            </strong>
          </div>
          {progress.unresolved > 0 && (
            <p className="error-message">
              {progress.unresolved} settings exceeded the per-setting work
              budget. They are unresolved, not rejected.
            </p>
          )}
          {!progress.candidates.length && !running && (
            <p className="muted">
              No candidates found in the settings tested. Check the crib,
              offset, rings, reflector, and cable limit.
            </p>
          )}
          {progress.candidates.length > 0 && (
            <>
              <div className="candidate-tabs" aria-label="Candidate settings">
                {progress.candidates.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(index)}
                    aria-pressed={index === selectedCandidate}
                    className={index === selectedCandidate ? "selected" : ""}
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
                    <span className="validation-badge">Replay checked</span>
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
                  <p className="candidate-plaintext">{candidate.plaintext}</p>
                  <p className="muted">
                    {candidate.unknown.length
                      ? `Unresolved letters: ${candidate.unknown.join(" ")}. They are treated as unplugged in this preview; other completions may exist.`
                      : "This candidate assigns all 26 letters; other compatible assignments may exist."}{" "}
                    These are compatible pairings, not proven original wiring. A
                    matching crib does not prove that this is the original key.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
