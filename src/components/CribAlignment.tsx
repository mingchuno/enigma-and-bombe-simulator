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
  const maximum = Math.max(0, ciphertext.length - crib.length);
  const collisions = [...crib].flatMap((letter, index) =>
    ciphertext[offset + index] === letter ? [offset + index + 1] : [],
  );
  return (
    <details className="alignment-explorer">
      <summary>Slide the crib against the intercept</summary>
      <p className="field-hint">
        A letter cannot encrypt to itself. An × rules out this alignment; no ×
        only means it is possible.
      </p>
      <label>
        Alignment offset: {offset}
        <input
          aria-label="Slide crib offset"
          type="range"
          min={0}
          max={maximum}
          value={Math.min(offset, maximum)}
          disabled={disabled}
          onChange={(e) => onOffset(Number(e.target.value))}
        />
      </label>
      <div className="crib-strip" aria-label="Aligned ciphertext and plaintext">
        <div className="strip-row">
          {[...ciphertext].map((letter, index) => (
            <span key={index}>
              <small>{index + 1}</small>
              {letter}
            </span>
          ))}
        </div>
        <div className="strip-row">
          {[...ciphertext].map((_, index) => {
            const letter = crib[index - offset];
            return (
              <span
                className={letter === ciphertext[index] ? "collision" : ""}
                key={index}
              >
                {letter ?? "·"}
                <small>{letter === ciphertext[index] ? "×" : ""}</small>
              </span>
            );
          })}
        </div>
      </div>
      <p className="field-hint">
        {collisions.length
          ? `Impossible matches at positions ${collisions.join(", ")}.`
          : "No self-encryption conflicts at this alignment."}
      </p>
    </details>
  );
}
