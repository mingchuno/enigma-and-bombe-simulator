import { cn } from "../lib/cn.ts";
import styles from "./BombeResults.module.css";
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
    <section data-testid="results-panel" className={styles.resultsPanel}>
      <Help term="Reading search results">
        Tested counts rotor orientations checked. A candidate is one plugboard
        assignment that passes the crib check, not a confirmed decryption.
        Unknown letters are left unplugged only for the preview. A stopped
        search or candidate limit leaves untested settings.
      </Help>
      <div className={styles.sectionHeading}>
        <h2>Search log</h2>
        <span
          className={cn(styles.searchStatus, { [styles.running]: running })}
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
        className={styles.progress}
        max={total}
        value={progress.tested}
        aria-label="Search progress"
      />
      <div data-testid="progress-details" className={styles.progressDetails}>
        <span>
          {progress.tested.toLocaleString()} / {total.toLocaleString()} tested
        </span>
        <span>
          {percentage.toFixed(PROGRESS_DECIMAL_PLACES)}% checked <b>·</b>{" "}
          {elapsed.toFixed(PROGRESS_DECIMAL_PLACES)}s
        </span>
      </div>
      {progress.reason === "limit" && !running && (
        <p className={styles.fieldHint}>
          Stopped after finding {progress.candidates.length} crib-compatible
          candidates. {(total - progress.tested).toLocaleString()} settings
          remain untested. The percentage measures search coverage, not
          confidence. Use a longer crib or narrow the rotor orders, then run
          again. Selecting a candidate shows its settings and a decryption
          preview; a matching crib does not confirm the key.
        </p>
      )}
      {status === "idle" ? (
        <div className={styles.resultsEmpty}>
          <span className={styles.searchGlyph} aria-hidden="true">
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
          <div className={styles.runSummary}>
            <span>
              Last checked <code>{progress.current || "Preparing…"}</code>
            </span>
            <strong>
              {progress.candidates.length}{" "}
              {progress.candidates.length === 1 ? "candidate" : "candidates"}
            </strong>
          </div>
          {progress.unresolved > 0 && (
            <p className={styles.errorMessage}>
              {progress.unresolved} settings exceeded the per-setting work
              budget. They are unresolved, not rejected.
            </p>
          )}
          {!progress.candidates.length && !running && (
            <p className={styles.muted}>
              No candidates found in the settings tested. Check the crib,
              offset, rings, reflector, and cable limit.
            </p>
          )}
          {progress.candidates.length > 0 && (
            <>
              <div
                data-testid="candidate-tabs"
                className={styles.candidateTabs}
                aria-label="Candidate settings"
              >
                {progress.candidates.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(index)}
                    aria-pressed={index === selectedCandidate}
                    className={cn({
                      [styles.selected]: index === selectedCandidate,
                    })}
                  >
                    {result.windows}
                    <small>{result.rotors.join("–")}</small>
                  </button>
                ))}
              </div>
              {candidate && (
                <div
                  data-testid="candidate-detail"
                  className={styles.candidateDetail}
                >
                  <div className={styles.sectionHeading}>
                    <h3>Crib-compatible candidate</h3>
                    <span className={styles.validationBadge}>
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
                  <p
                    data-testid="candidate-plaintext"
                    className={styles.candidatePlaintext}
                  >
                    {candidate.plaintext}
                  </p>
                  <p className={styles.muted}>
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
