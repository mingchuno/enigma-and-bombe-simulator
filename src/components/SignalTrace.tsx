import styles from "./SignalTrace.module.css";
import type { Trace } from "../engine/enigma.ts";
import { REFLECTOR_TRACE_INDEX, ROTOR_SLOT } from "../engine/enigma.ts";
import { Help } from "./Help.tsx";

function SignalStages({ trace }: { trace: Trace }) {
  const groups = [
    {
      title: "Toward the reflector",
      start: 1,
      end: REFLECTOR_TRACE_INDEX,
      stage: "forward",
    },
    {
      title: "Reflection",
      start: REFLECTOR_TRACE_INDEX,
      end: REFLECTOR_TRACE_INDEX + 1,
      stage: "reflection",
    },
    {
      title: "Back to the lamp",
      start: REFLECTOR_TRACE_INDEX + 1,
      end: trace.path.length - 1,
      stage: "return",
    },
  ];

  return (
    <div className={styles.signalPath}>
      {groups.map((group) => (
        <table
          className={styles.signalStage}
          data-stage={group.stage}
          key={group.title}
        >
          <caption>{group.title}</caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">In</th>
              <td aria-hidden="true" />
              <th scope="col">Out</th>
            </tr>
          </thead>
          <tbody>
            {trace.path.slice(group.start, group.end).map((step, offset) => {
              const input = trace.path[group.start + offset - 1].letter;
              const component = step.label.replace(/ [→←]$/, "");
              const unchangedPlug =
                component === "Plugboard" && input === step.letter;
              return (
                <tr key={step.label}>
                  <th scope="row">
                    {component}
                    {unchangedPlug && (
                      <small className={styles.signalNote}>
                        {input} has no plugboard connection; unchanged.
                      </small>
                    )}
                    {group.stage === "reflection" && (
                      <small className={styles.signalNote}>
                        Signal returns through the rotors.
                      </small>
                    )}
                  </th>
                  <td className={styles.signalInput}>{input}</td>
                  <td className={styles.signalDirection} aria-hidden="true">
                    →
                  </td>
                  <td>
                    <strong className={styles.signalLetter}>
                      {step.letter}
                    </strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </div>
  );
}

export function SignalTrace({
  trace,
  selected,
  count,
  onSelect,
}: {
  trace?: Trace;
  selected: number;
  count: number;
  onSelect: (value: number) => void;
}) {
  return (
    <aside className={styles.signalPanel}>
      <div className={styles.sectionHeading}>
        <h2>Follow the signal</h2>
      </div>
      <p className={styles.muted}>
        One keypress. A journey through the machine.
      </p>
      <Help term="The complete signal route">
        Key → plugboard → right, middle, left rotors → reflector → left, middle,
        right rotors in reverse → plugboard again → lamp. The lamp only displays
        the final letter; it does not scramble it.
      </Help>
      {trace ? (
        <>
          <div className={styles.traceSummary}>
            <div>
              <small className={styles.traceEndpointLabel}>Key pressed</small>
              <span>{trace.input}</span>
            </div>
            <span className={styles.traceArrow}>→</span>
            <div>
              <small className={styles.traceEndpointLabel}>Lamp lit</small>
              <span>{trace.output}</span>
            </div>
          </div>
          <label className={styles.traceScrubber}>
            Inspect letter{" "}
            <strong>
              {selected + 1} / {count}
            </strong>
            <input
              aria-label="Inspect letter"
              type="range"
              min="0"
              max={count - 1}
              value={selected}
              onChange={(e) => onSelect(Number(e.target.value))}
            />
          </label>
          <SignalStages trace={trace} />
          <div
            data-testid="step-explanation"
            className={styles.stepExplanation}
          >
            <strong>
              {trace.before} <span>→</span> {trace.after}
            </strong>
            <p>
              {trace.stepped[ROTOR_SLOT.LEFT]
                ? "The middle rotor is at its notch: both the left and middle rotors advance."
                : trace.stepped[ROTOR_SLOT.MIDDLE]
                  ? "The right rotor reaches turnover and advances the middle rotor."
                  : "The right rotor advances before the signal enters."}
            </p>
          </div>
        </>
      ) : (
        <div className={styles.traceEmpty}>
          <div className={styles.emptyCircuit} aria-hidden="true">
            <span>A</span>
            <i />
            <span>?</span>
          </div>
          <h3>A letter’s journey</h3>
          <p>
            Press a key or enter a message to see every substitution, from
            keyboard to lamp.
          </p>
        </div>
      )}
    </aside>
  );
}
