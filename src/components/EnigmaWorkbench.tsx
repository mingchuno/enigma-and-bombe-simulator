import { useEffect, useMemo, useState } from "react";
import {
  ALPHABET,
  DEFAULT_CONFIG,
  Enigma,
  normalizeText,
  parsePlugboard,
} from "../engine/enigma.ts";
import type { MachineConfig, Trace } from "../engine/enigma.ts";
import { Configuration } from "./Configuration.tsx";
import { SignalTrace } from "./SignalTrace.tsx";
import { Icon } from "./Icon.tsx";

const KEY_ROWS = ["QWERTZUIO", "ASDFGHJK", "PYXCVBNML"];
export interface Transfer {
  config: MachineConfig;
  ciphertext: string;
  crib: string;
}
export function EnigmaWorkbench({
  onTransfer,
}: {
  onTransfer: (value: Transfer) => void;
}) {
  const [config, setConfig] = useState<MachineConfig>(DEFAULT_CONFIG);
  const [message, setMessage] = useState("");
  const [selection, setSelection] = useState<number | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const processed = useMemo(() => {
    try {
      const enigma = new Enigma(config);
      const traces = [...message].map((letter) => enigma.press(letter));
      return {
        traces,
        output: traces.map((trace) => trace.output).join(""),
        windows: enigma.windows,
        error: "",
      };
    } catch (error) {
      return {
        traces: [] as Trace[],
        output: "",
        windows: config.windows,
        error: (error as Error).message,
      };
    }
  }, [config, message]);
  const selected = Math.min(
    selection ?? processed.traces.length - 1,
    processed.traces.length - 1,
  );
  const trace = processed.traces[selected];
  let pairs: number[] = [];
  try {
    pairs = parsePlugboard(config.plugs);
  } catch {
    /* The validation message is rendered below the controls. */
  }

  useEffect(() => {
    if (!isPlaying) return;
    const sample = "HELLOWORLD";
    let index = 0;
    const timer = window.setInterval(() => {
      index++;
      setMessage(sample.slice(0, index));
      if (index === sample.length) setPlaying(false);
    }, 380);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function changeMessage(value: string) {
    setPlaying(false);
    setSelection(null);
    setMessage(normalizeText(value).slice(0, 500));
  }
  function playExample() {
    setConfig(DEFAULT_CONFIG);
    setSelection(null);
    setMessage("");
    setPlaying(true);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(processed.output);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select text to copy");
    }
    window.setTimeout(() => setCopyStatus("Copy"), 2200);
  }

  return (
    <div className="workbench-grid">
      <div className="enigma-main">
        <section className="machine-panel" aria-label="Enigma machine">
          <div className="machine-top">
            <span className="machine-name">ENIGMA I</span>
            <span className="machine-meta">
              3 rotors <b>·</b> 26 letters <b>·</b> One reversible cipher
            </span>
          </div>
          <Configuration
            config={config}
            onChange={(next) => {
              setPlaying(false);
              setConfig(next);
            }}
            current={trace?.after ?? processed.windows}
          />
          <div className="machine-options">
            <label>
              Reflector
              <select
                aria-label="Reflector"
                value={config.reflector}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    reflector: e.target.value as "B" | "C",
                  })
                }
              >
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <span>Windows show the position after the inspected letter.</span>
          </div>
          <div className="keyboard-heading">
            <span>Keyboard & lampboard</span>
            <span>
              {trace ? (
                <>
                  {trace.input} <span className="tiny-arrow">→</span>{" "}
                  <b>{trace.output}</b>
                </>
              ) : (
                "Ready for a keypress"
              )}
            </span>
          </div>
          <div className="keyboard">
            {KEY_ROWS.map((row) => (
              <div className="key-row" key={row}>
                {[...row].map((letter) => (
                  <button
                    key={letter}
                    className={`machine-key ${trace?.output === letter ? "lit" : ""} ${trace?.input === letter ? "pressed" : ""}`}
                    onClick={() => changeMessage(message + letter)}
                    aria-label={`Type ${letter}`}
                    disabled={Boolean(processed.error) || message.length >= 500}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="machine-bottom">
            <span>
              <i className="status-dot" />
              {message.length} letters processed
            </span>
            <button
              onClick={() => changeMessage(message.slice(0, -1))}
              disabled={!message}
            >
              <Icon name="undo" size={15} />
              Undo letter
            </button>
          </div>
        </section>
        <section className="message-panel">
          <div className="section-heading">
            <h2>Your message</h2>
            <button
              className="text-button"
              onClick={playExample}
              disabled={isPlaying}
            >
              <Icon name="play" size={14} />
              {isPlaying ? "Playing example…" : "Play an example"}
            </button>
          </div>
          <div className="message-columns">
            <label>
              Input <span>A–Z only</span>
              <textarea
                aria-label="Message input"
                value={message}
                onChange={(e) => changeMessage(e.target.value)}
                placeholder="Type a message, or use the keys above…"
                spellCheck={false}
                maxLength={1000}
              />
            </label>
            <div className="output-field">
              <div className="output-label">
                Output{" "}
                <button onClick={copy} disabled={!processed.output}>
                  <Icon name="copy" size={14} />
                  {copyStatus}
                </button>
              </div>
              <textarea
                aria-label="Message output"
                readOnly
                value={processed.output.match(/.{1,5}/g)?.join(" ") ?? ""}
                placeholder="Your enciphered message appears here."
              />
            </div>
          </div>
          <div className="message-footer">
            <span>Same settings + ciphertext = original message.</span>
            <button
              className="text-button"
              onClick={() => changeMessage("")}
              disabled={!message}
            >
              <Icon name="reset" size={14} />
              Clear message
            </button>
          </div>
        </section>
        <section className="plugboard-panel">
          <div className="section-heading">
            <h2>Plugboard</h2>
            <span className="muted">
              {pairs.filter((partner, letter) => partner > letter).length} / 13
              cables
            </span>
          </div>
          <div className="plugboard-form">
            <label>
              Swap pairs of letters
              <input
                aria-label="Plugboard pairs"
                placeholder="e.g. AV BS CG DL"
                value={config.plugs}
                onChange={(e) =>
                  setConfig({ ...config, plugs: e.target.value.toUpperCase() })
                }
                spellCheck={false}
              />
            </label>
            <p>
              Each cable swaps two letters on both the outward and return
              journey. Leave empty for no swaps.
            </p>
          </div>
          {processed.error && (
            <p className="error-message" role="alert">
              {processed.error}
            </p>
          )}
          <div className="plug-sockets" aria-label="Plugboard connections">
            {[...ALPHABET].map((letter, index) => (
              <span
                key={letter}
                className={
                  pairs[index] !== undefined && pairs[index] !== index
                    ? "connected"
                    : ""
                }
                title={
                  pairs[index] === index
                    ? `${letter}: unplugged`
                    : `${letter} connected to ${ALPHABET[pairs[index]] ?? "?"}`
                }
              >
                {letter}
                <small>
                  {pairs[index] !== undefined && pairs[index] !== index
                    ? ALPHABET[pairs[index]]
                    : "·"}
                </small>
              </span>
            ))}
          </div>
        </section>
        <div className="transfer-strip">
          <div>
            <strong>Now try the other side.</strong>
            <p>Use your message as a codebreaking exercise.</p>
          </div>
          <button
            className="primary-button"
            disabled={message.length < 8 || Boolean(processed.error)}
            onClick={() =>
              onTransfer({
                config,
                ciphertext: processed.output,
                crib: message.slice(0, 40),
              })
            }
          >
            Send to Bombe
            <Icon name="arrow" />
          </button>
        </div>
      </div>
      <SignalTrace
        trace={trace}
        count={processed.traces.length}
        selected={selected}
        onSelect={setSelection}
      />
    </div>
  );
}
