import type { Trace } from '../engine/enigma.ts';
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
    <aside className="signal-panel">
      <div className="section-heading">
        <h2>Follow the signal</h2>
        <span className="live-mark">
          <i /> Live
        </span>
      </div>
      <p className="muted">One keypress. A journey through the machine.</p>
      {trace ? (
        <>
          <div className="trace-summary">
            <span>{trace.input}</span>
            <span className="trace-arrow">→</span>
            <span>{trace.output}</span>
          </div>
          <label className="trace-scrubber">
            Inspect letter{' '}
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
          <div className="signal-path">
            {trace.path.map((step, index) => (
              <div
                key={index}
                className={`signal-node ${index === 5 ? 'reflection' : ''} ${index > 5 ? 'return-path' : ''}`}
              >
                <span className="signal-letter">{step.letter}</span>
                <span>{step.label}</span>
                {index === 5 && <small>turn back</small>}
              </div>
            ))}
          </div>
          <div className="step-explanation">
            <strong>
              {trace.before} <span>→</span> {trace.after}
            </strong>
            <p>
              {trace.stepped[0]
                ? 'The middle rotor is at its notch: both the left and middle rotors advance.'
                : trace.stepped[1]
                  ? 'The right rotor reaches turnover and advances the middle rotor.'
                  : 'The right rotor advances before the signal enters.'}
            </p>
          </div>
        </>
      ) : (
        <div className="trace-empty">
          <div className="empty-circuit" aria-hidden="true">
            <span>A</span>
            <i />
            <span>?</span>
          </div>
          <h3>A letter’s journey</h3>
          <p>Press a key or enter a message to see every substitution, from keyboard to lamp.</p>
        </div>
      )}
    </aside>
  );
}
