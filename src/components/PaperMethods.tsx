import { ScrollRegion } from "./ScrollRegion.tsx";
import { useState } from "react";
import { ALPHABET, normalizeText } from "../engine/enigma.ts";
import { compareStrips } from "../engine/historical.ts";

export function PaperMethods() {
  const [first, setFirst] = useState("QWERTYUIOPASDFGHJKLZXCVBNM");
  const [second, setSecond] = useState("RTYUBOPASDFXHJKLQXCV");
  const [shift, setShift] = useState(0);
  const [overlay, setOverlay] = useState(true);
  const { matches, overlap } = compareStrips(first, second, shift);
  const origin = Math.min(0, shift),
    end = Math.max(first.length, shift + second.length);
  const width = 55 + (end - origin) * 19;
  return (
    <section className="paper-methods learning-panel">
      <div className="section-heading">
        <h2>The paper before the machine</h2>
        <span className="validation-badge">
          Banbury coincidence demonstration
        </span>
      </div>
      <p>
        Sliding punched strips most plausibly recalls{" "}
        <strong>Banbury sheets</strong>. Each column encodes one ciphertext
        letter with a hole in that letter’s row. Superimpose two strips:
        coincident letters let light through both holes.
      </p>
      <div className="paper-inputs">
        <label>
          First ciphertext
          <input
            aria-label="First Banbury ciphertext"
            value={first}
            onChange={(e) => {
              setFirst(normalizeText(e.target.value).slice(0, 60));
              setShift(0);
            }}
          />
        </label>
        <label>
          Second ciphertext
          <input
            aria-label="Second Banbury ciphertext"
            value={second}
            onChange={(e) => {
              setSecond(normalizeText(e.target.value).slice(0, 60));
              setShift(0);
            }}
          />
        </label>
      </div>
      <p className="field-hint">
        Editable synthetic strips, up to 60 letters each. These are two
        ciphertexts, not ciphertext and a plaintext crib.
      </p>
      <div className="paper-controls">
        <label>
          Shift second strip: {shift}
          <input
            aria-label="Shift punched strip"
            type="range"
            min={-Math.max(0, second.length - 1)}
            max={Math.max(0, first.length - 1)}
            value={shift}
            disabled={!first.length || !second.length}
            onChange={(e) => setShift(Number(e.target.value))}
          />
        </label>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={overlay}
            onChange={(e) => setOverlay(e.target.checked)}
          />
          Overlay both sheets
        </label>
        <button className="text-button" onClick={() => setShift(0)}>
          Reset shift
        </button>
      </div>
      {(!first.length || !second.length) && (
        <p className="field-hint" role="status">
          Enter both ciphertexts to compare the sheets.
        </p>
      )}
      <p className="field-hint">
        Scroll sideways to inspect the full strips. The diagram is a schematic
        of the holes.
      </p>
      <ScrollRegion className="punched-scroll" label="Punched sheet diagram">
        <svg
          viewBox={`0 0 ${Math.max(width, 160)} ${overlay ? 440 : 845}`}
          style={{ minWidth: Math.max(width, 160) }}
          role="img"
          aria-label={`${matches.length} coincident holes in ${overlap} overlapping columns at shift ${shift}`}
        >
          {[0, ...(!overlay ? [1] : [])].map((layer) => (
            <g key={layer} transform={`translate(0 ${layer * 405})`}>
              <rect
                x="0"
                y="10"
                width={Math.max(width, 160)}
                height="400"
                rx="5"
                fill="#e4d3ad"
              />
              {[...ALPHABET].map((letter, row) => (
                <text
                  key={letter}
                  x="11"
                  y={41 + row * 14}
                  className="paper-row-label"
                >
                  {letter}
                </text>
              ))}
            </g>
          ))}
          {[...first].map((letter, col) => (
            <g key={col}>
              <text
                x={42 + (col - origin) * 19}
                y="25"
                className="paper-position"
              >
                {col + 1}
              </text>
              <circle
                cx={42 + (col - origin) * 19}
                cy={37 + ALPHABET.indexOf(letter) * 14}
                r="5"
                className={overlay ? "hole-first" : "hole-open"}
              />
            </g>
          ))}
          {[...second].map((letter, col) => (
            <circle
              key={col}
              cx={42 + (col + shift - origin) * 19}
              cy={(overlay ? 0 : 405) + 37 + ALPHABET.indexOf(letter) * 14}
              r="5"
              className={
                overlay
                  ? matches.includes(col + shift)
                    ? "hole-match"
                    : "hole-second"
                  : "hole-open"
              }
            />
          ))}
        </svg>
      </ScrollRegion>
      <div className="paper-result">
        <strong>
          {matches.length} coincidences / {overlap} overlapping letters
        </strong>
        <p>
          {matches.length
            ? `First-strip positions: ${matches.map((index) => index + 1).join(", ")}.`
            : "No holes align at this shift."}{" "}
          {overlay
            ? "Gold outlines locate first-sheet holes; dark outlines locate second-sheet holes. White openings pass through both."
            : "The upper strip is the first ciphertext; the lower strip is the second. White openings show every hole in each separate sheet."}
        </p>
      </div>
      <p className="scope-note">
        Historical Banburismus used statistical evidence across messages to
        investigate their relative rotor settings. A raw coincidence count is
        not that statistical test and does not decrypt a message. This activity
        demonstrates alignment and intersection only.
      </p>
      <p className="source-line">
        Sources:{" "}
        <a
          href="https://www.codesandciphers.org.uk/documents/cryptdict/page05.htm"
          target="_blank"
          rel="noreferrer"
        >
          1944 cryptographic dictionary
        </a>{" "}
        ·{" "}
        <a
          href="https://artsandculture.google.com/asset/banbury-sheet/wQFt6FrZTtB_Sg"
          target="_blank"
          rel="noreferrer"
        >
          Bletchley Park’s Banbury sheet
        </a>{" "}
        ·{" "}
        <a
          href="https://journal.sciencemuseum.ac.uk/article/zygalski-sheets-polish-codebreaking-and-the-role-of-reconstruction-in-the-top-secret-exhibition-at-the-science-museum/"
          target="_blank"
          rel="noreferrer"
        >
          Science Museum reconstruction study
        </a>
      </p>
    </section>
  );
}
