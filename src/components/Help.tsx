import type { ReactNode } from "react";
import { useId } from "react";

/** Native disclosure: keyboard/touch accessible; explanation stays open while reading. */
export function Help({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <details className="concept-help">
      <summary aria-label={`Explain ${term}`} aria-controls={id}>
        <span aria-hidden="true">?</span>
        <span>{term}</span>
      </summary>
      <div id={id} className="concept-help-body">
        {children}
      </div>
    </details>
  );
}

export function ConfigurationHelp() {
  return (
    <div className="help-row">
      <Help term="Rotor order">
        A rotor is a wheel containing 26 crossed wires. I–V have different
        wirings. The three slots are read left to right; changing their order
        changes the cipher. Selecting an installed rotor swaps the two wheels.
      </Help>
      <Help term="Start windows">
        The three letters showing before the first keypress. The right wheel
        advances before a letter is encoded. To decipher, start with exactly the
        same letters and all the same settings.
      </Help>
      <Help term="Ring settings">
        The alphabet ring can turn relative to the internal wiring. Ring A (01)
        has no offset; B (02) shifts it one position. This is different from
        turning the whole wheel using Start. The visible turnover letter stays
        fixed.
      </Help>
      <Help term="Reflector">
        A fixed set of 13 paired wires sends the current back through all three
        rotors, then the plugboard. It makes the cipher reversible and prevents
        any letter encrypting to itself. B and C use different pairs.
      </Help>
    </div>
  );
}
