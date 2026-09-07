import { cn } from "../lib/cn.ts";
import styles from "./CribAlignment.module.css";
import { inspectCribAlignment } from "../engine/crib-menu.ts";

export function CribAlignment({
  ciphertext,
  crib,
  offset,
  onOffset,
  disabled,
}: {
  ciphertext: string;
  crib: string;
  offset: number;
  onOffset: (value: number) => void;
  disabled: boolean;
}) {
  const { maximum, fits, collisions } = inspectCribAlignment(
    ciphertext,
    crib,
    offset,
  );
  return (
    <details
      data-testid="alignment-explorer"
      className={styles.alignmentExplorer}
    >
      <summary>Slide the crib against the intercept</summary>
      <p className={styles.fieldHint}>
        A letter cannot encrypt to itself. An × rules out this alignment; no ×
        only means it passes this test when the entire crib fits.
      </p>
      <label>
        Alignment offset: {offset}
        <input
          aria-label="Slide crib offset"
          type="range"
          min={0}
          max={maximum}
          value={Math.max(0, Math.min(offset, maximum))}
          disabled={
            disabled ||
            !ciphertext.length ||
            !crib.length ||
            crib.length > ciphertext.length
          }
          onChange={(e) => onOffset(Number(e.target.value))}
        />
      </label>
      {fits && (
        <div
          className={styles.cribStrip}
          aria-label="Aligned ciphertext and plaintext"
        >
          <div className={styles.stripRow}>
            {[...ciphertext].map((letter, index) => (
              <span key={index}>
                <small>{index + 1}</small>
                {letter}
              </span>
            ))}
          </div>
          <div className={styles.stripRow}>
            {[...ciphertext].map((_, index) => {
              const letter = crib[index - offset];
              return (
                <span
                  className={cn({
                    [styles.collision]: letter === ciphertext[index],
                  })}
                  key={index}
                >
                  {letter ?? "·"}
                  <small>{letter === ciphertext[index] ? "×" : ""}</small>
                </span>
              );
            })}
          </div>
        </div>
      )}
      <p className={styles.fieldHint} role="status">
        {!fits
          ? `Choose a whole-number offset from 0 to ${maximum} and a nonempty crib that fits inside the ciphertext.`
          : collisions.length
            ? `Impossible matches at positions ${collisions.map((position) => position + 1).join(", ")}.`
            : "No self-encryption conflicts at this alignment."}
      </p>
    </details>
  );
}
