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
      <div className="punched-scroll">
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
      </div>
      <div className="paper-result">
        <strong>
          {matches.length} coincidences / {overlap} overlapping letters
        </strong>
        <p>
          {matches.length
            ? `First-strip positions: ${matches.map((index) => index + 1).join(", ")}.`
            : "No holes align at this shift."}{" "}
          Gold outlines locate first-sheet holes; dark outlines locate
          second-sheet holes. White openings pass through both.
        </p>
      </div>
      <p className="scope-note">
        Historical Banburismus used statistical evidence across messages to
        investigate their relative rotor settings. A raw coincidence count is
        not that statistical test and does not decrypt a message. This activity
        demonstrates alignment and intersection only.
      </p>
      <details className="paper-alternative">
        <summary>Could it have been Zygalski sheets?</summary>
        <p>
          Yes. Zygalski sheets were grids of candidate rotor settings, layered
          and shifted to leave holes in common. They exploited repetitions in an
          earlier doubled message-key procedure. They were not the long,
          one-letter-per-column ciphertext strips shown here, and were not a
          Bombe crib menu. Without a photograph of that exhibit, the
          identification remains uncertain.
        </p>
      </details>
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
