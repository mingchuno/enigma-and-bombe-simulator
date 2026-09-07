import styles from "./Configuration.module.css";
import { ALPHABET, ROTOR_NAMES, mod26 } from "../engine/enigma.ts";
import type { MachineConfig, RotorName, Triple } from "../engine/enigma.ts";

const RING_NUMBER_DIGITS = 2;

interface Props {
  config: MachineConfig;
  onChange: (config: MachineConfig) => void;
  current?: string;
  disabled?: boolean;
  showWindows?: boolean;
}
export function Configuration({
  config,
  onChange,
  current,
  disabled,
  showWindows = true,
}: Props) {
  function changeRotor(slot: number, name: RotorName) {
    const next = [...config.rotors] as Triple<RotorName>;
    const existing = next.indexOf(name);
    if (existing >= 0) next[existing] = next[slot];
    next[slot] = name;
    onChange({ ...config, rotors: next });
  }
  function changeLetter(
    field: "rings" | "windows",
    slot: number,
    value: string,
  ) {
    const next = [...config[field]];
    next[slot] = value;
    onChange({ ...config, [field]: next.join("") });
  }
  return (
    <div className={styles.rotorControls}>
      {config.rotors.map((name, slot) => (
        <div key={slot}>
          <div className={styles.rotorHeading}>
            <span>{["Left · slow", "Middle", "Right · fast"][slot]}</span>
            <select
              aria-label={`${["Left", "Middle", "Right"][slot]} rotor`}
              value={name}
              disabled={disabled}
              onChange={(e) => changeRotor(slot, e.target.value as RotorName)}
            >
              {ROTOR_NAMES.map((rotor) => (
                <option key={rotor}>{rotor}</option>
              ))}
            </select>
          </div>
          {current && (
            <div className={styles.rotorWindow}>
              <span aria-hidden="true">
                {ALPHABET[mod26(ALPHABET.indexOf(current[slot]) - 1)]}
              </span>
              <strong>{current[slot]}</strong>
              <span aria-hidden="true">
                {ALPHABET[mod26(ALPHABET.indexOf(current[slot]) + 1)]}
              </span>
            </div>
          )}
          <div className={styles.rotorSettings}>
            {showWindows && (
              <label>
                Start
                <select
                  aria-label={`${["Left", "Middle", "Right"][slot]} starting window`}
                  value={config.windows[slot]}
                  disabled={disabled}
                  onChange={(e) =>
                    changeLetter("windows", slot, e.target.value)
                  }
                >
                  {[...ALPHABET].map((letter) => (
                    <option key={letter}>{letter}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Ring
              <select
                aria-label={`${["Left", "Middle", "Right"][slot]} ring setting`}
                value={config.rings[slot]}
                disabled={disabled}
                onChange={(e) => changeLetter("rings", slot, e.target.value)}
              >
                {[...ALPHABET].map((letter, index) => (
                  <option key={letter} value={letter}>
                    {letter} ·{" "}
                    {String(index + 1).padStart(RING_NUMBER_DIGITS, "0")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
