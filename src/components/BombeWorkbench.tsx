import { useEffect, useMemo, useRef, useState } from 'react';
import { ALPHABET, DEFAULT_CONFIG, Enigma, normalizeText } from '../engine/enigma.ts';
import type { MachineConfig } from '../engine/enigma.ts';
import { buildMenu } from '../engine/bombe.ts';
import type { SearchUpdate } from '../engine/bombe.ts';
import type { Transfer } from './EnigmaWorkbench.tsx';
import { Configuration } from './Configuration.tsx';
import { Icon } from './Icon.tsx';
import { MenuGraph } from './MenuGraph.tsx';

const DEMO_CONFIG: MachineConfig = { ...DEFAULT_CONFIG, windows: 'AAF', plugs: 'AV BS CG DL' };
const DEMO_PLAIN = 'WETTERVORHERSAGEFUERDIEBISKAYA';
const DEMO_CIPHER = new Enigma(DEMO_CONFIG).process(DEMO_PLAIN);
const emptyProgress: SearchUpdate = {
  tested: 0,
  total: 17576,
  unresolved: 0,
  candidates: [],
  current: '',
  reason: 'running',
};

export function BombeWorkbench({ transfer }: { transfer: Transfer | null }) {
  const [config, setConfig] = useState<MachineConfig>(DEFAULT_CONFIG);
  const [ciphertext, setCiphertext] = useState(DEMO_CIPHER);
  const [crib, setCrib] = useState(DEMO_PLAIN);
  const [offset, setOffset] = useState(0);
  const [allOrders, setAllOrders] = useState(false);
  const [maxPairs, setMaxPairs] = useState(4);
  const [selectedEdge, setSelectedEdge] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(0);
  const [progress, setProgress] = useState<SearchUpdate>(emptyProgress);
  const [status, setStatus] = useState<'idle' | 'running' | 'stopped' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const worker = useRef<Worker | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(0);
  const running = status === 'running';

  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    if (!transfer) return;
    worker.current?.terminate();
    setConfig({ ...transfer.config, windows: 'AAA', plugs: '' });
    setCiphertext(transfer.ciphertext);
    setCrib(transfer.crib);
    setOffset(0);
    setMaxPairs(13);
    setAllOrders(false);
    setStatus('idle');
    setProgress(emptyProgress);
    setError('');
    setIsDemo(false);
  }, [transfer]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setElapsed((performance.now() - startTime.current) / 1000),
      100,
    );
    return () => clearInterval(timer);
  }, [running]);

  const menu = useMemo(() => {
    try {
      return { edges: buildMenu(ciphertext, crib, offset), error: '' };
    } catch (problem) {
      return { edges: [], error: (problem as Error).message };
    }
  }, [ciphertext, crib, offset]);

  function invalidate() {
    setStatus('idle');
    setProgress(emptyProgress);
    setError('');
    setIsDemo(false);
    setSelectedEdge(0);
    setSelectedCandidate(0);
  }
  function loadDemo() {
    invalidate();
    setConfig(DEFAULT_CONFIG);
    setCiphertext(DEMO_CIPHER);
    setCrib(DEMO_PLAIN);
    setOffset(0);
    setMaxPairs(4);
    setAllOrders(false);
    setIsDemo(true);
  }
  function startSearch() {
    worker.current?.terminate();
    setProgress({ ...emptyProgress, total: allOrders ? 1054560 : 17576 });
    setError('');
    setSelectedCandidate(0);
    setStatus('running');
    setElapsed(0);
    startTime.current = performance.now();
    try {
      const nextWorker = new Worker(new URL('../engine/bombe.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current = nextWorker;
      nextWorker.onmessage = (event) => {
        if (event.data.type === 'error') {
          setError(event.data.message);
          setStatus('error');
          nextWorker.terminate();
          return;
        }
        const update = event.data.update as SearchUpdate;
        setProgress(update);
        if (update.reason !== 'running') {
          setStatus('done');
          setElapsed((performance.now() - startTime.current) / 1000);
          nextWorker.terminate();
        }
      };
      nextWorker.onerror = () => {
        setError('The search worker failed. Try running the search again.');
        setStatus('error');
        nextWorker.terminate();
      };
      nextWorker.postMessage({ config, ciphertext, crib, offset, allOrders, maxPairs });
    } catch (problem) {
      setError((problem as Error).message);
      setStatus('error');
    }
  }
  function cancelSearch() {
    worker.current?.terminate();
    setStatus('stopped');
  }
  const candidate = progress.candidates[selectedCandidate];
  const edge = menu.edges[Math.min(selectedEdge, menu.edges.length - 1)];
  const percentage = (progress.tested / progress.total) * 100;

  return (
    <div className="bombe-grid">
      <div className="bombe-inputs">
        <section className="intercept-panel">
          <div className="section-heading">
            <h2>The intercept</h2>
            <button className="text-button" onClick={loadDemo} disabled={running}>
              <Icon name="reset" size={15} />
              Load example
            </button>
          </div>
          <p className="muted">Start with ciphertext and a fragment of suspected plaintext.</p>
          <label>
            Ciphertext <span>{ciphertext.length} / 500</span>
            <textarea
              aria-label="Intercepted ciphertext"
              value={ciphertext}
              maxLength={1000}
              disabled={running}
              onChange={(e) => {
                invalidate();
                setCiphertext(normalizeText(e.target.value).slice(0, 500));
              }}
              spellCheck={false}
            />
          </label>
          <label>
            Crib <span>8–100 letters</span>
            <input
              aria-label="Plaintext crib"
              value={crib}
              disabled={running}
              onChange={(e) => {
                invalidate();
                setCrib(normalizeText(e.target.value).slice(0, 100));
              }}
              spellCheck={false}
            />
          </label>
          <div className="offset-control">
            <label>
              Crib offset
              <input
                aria-label="Crib offset"
                type="number"
                min="0"
                max={Math.max(0, ciphertext.length - crib.length)}
                value={offset}
                disabled={running}
                onChange={(e) => {
                  invalidate();
                  setOffset(Number(e.target.value));
                }}
              />
            </label>
            <p>
              0 starts at the first letter.
              <br />
              Move the crib to test another alignment.
            </p>
          </div>
          {menu.error && (
            <p className="error-message" role="alert">
              {menu.error}
            </p>
          )}
          {isDemo && (
            <details className="demo-note">
              <summary>About this generated example</summary>
              <p>
                Weather forecast crib, generated with I–II–III, rings AAA, reflector B, start AAF,
                and plugs AV BS CG DL. The search receives no starting windows or plug pairs.
              </p>
            </details>
          )}
        </section>
        <section className="search-settings">
          <h2>Set the search</h2>
          <p className="muted">
            Ring settings and reflector are known. Starting windows and plugboard are unknown.
          </p>
          <Configuration
            config={config}
            onChange={(next) => {
              invalidate();
              setConfig(next);
            }}
            disabled={running}
            showWindows={false}
          />
          <div className="search-fields">
            <label>
              Rotor orders
              <select
                aria-label="Rotor orders to search"
                disabled={running}
                value={allOrders ? 'all' : 'selected'}
                onChange={(e) => {
                  invalidate();
                  setAllOrders(e.target.value === 'all');
                }}
              >
                <option value="selected">Selected order</option>
                <option value="all">All 60 orders</option>
              </select>
            </label>
            <label>
              Reflector
              <select
                aria-label="Bombe reflector"
                disabled={running}
                value={config.reflector}
                onChange={(e) => {
                  invalidate();
                  setConfig({ ...config, reflector: e.target.value as 'B' | 'C' });
                }}
              >
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <label>
              Maximum cables
              <select
                aria-label="Maximum plugboard cables"
                disabled={running}
                value={maxPairs}
                onChange={(e) => {
                  invalidate();
                  setMaxPairs(Number(e.target.value));
                }}
              >
                {Array.from({ length: 14 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '0 · no plugboard' : `At most ${i}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="search-space">
            <strong>{(allOrders ? 1054560 : 17576).toLocaleString()}</strong>
            <span>rotor positions to test</span>
          </div>
          <button
            className={`primary-button search-button ${running ? 'cancel-button' : ''}`}
            disabled={!running && (Boolean(menu.error) || crib.length < 8)}
            onClick={running ? cancelSearch : startSearch}
          >
            <Icon name={running ? 'close' : 'play'} />
            {running ? 'Stop search' : 'Run Bombe search'}
          </button>
          <p className="search-limit">
            Shows one compatible plugboard per setting. Stops after 50 candidates. Use a longer crib
            to narrow the results.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
      <div className="bombe-analysis">
        <section className="menu-panel">
          <div className="section-heading">
            <h2>The crib menu</h2>
            <span className={`validation-badge ${menu.error ? 'invalid' : ''}`}>
              {menu.error ? 'Check alignment' : 'Alignment possible'}
            </span>
          </div>
          <p className="muted">
            Letters become nodes. Each plaintext–ciphertext pair connects them through a rotor
            state.
          </p>
          {menu.edges.length ? (
            <>
              <MenuGraph edges={menu.edges} selected={selectedEdge} onSelect={setSelectedEdge} />
              {edge && (
                <div className="constraint-equation">
                  <span>Position {edge.position + 1}</span>
                  <code>
                    P({ALPHABET[edge.b]}) = S<sub>{edge.position + 1}</sub>(P({ALPHABET[edge.a]}))
                  </code>
                  <p>
                    P is the unknown plugboard. S is the rotor path at this position. Pairings must
                    agree across every connection.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="menu-empty">
              A valid crib alignment will reveal the connection graph here.
            </div>
          )}
        </section>
        <section className="results-panel">
          <div className="section-heading">
            <h2>Search log</h2>
            <span className={`search-status ${running ? 'running' : ''}`} role="status">
              {status === 'idle'
                ? 'Ready'
                : running
                  ? 'Searching'
                  : status === 'stopped'
                    ? 'Stopped · partial search'
                    : status === 'error'
                      ? 'Search failed'
                      : progress.reason === 'limit'
                        ? 'Candidate limit reached'
                        : progress.unresolved
                          ? 'Finished · unresolved settings'
                          : 'Search complete'}
            </span>
          </div>
          <progress max={progress.total} value={progress.tested} aria-label="Search progress" />
          <div className="progress-details">
            <span>
              {progress.tested.toLocaleString()} / {progress.total.toLocaleString()} tested
            </span>
            <span>
              {percentage.toFixed(1)}% <b>·</b> {elapsed.toFixed(1)}s
            </span>
          </div>
          {status === 'idle' ? (
            <div className="results-empty">
              <span className="search-glyph" aria-hidden="true">
                ?
              </span>
              <div>
                <h3>Find what the settings allow.</h3>
                <p>
                  Run the search to test each starting position, propagate plugboard pairings, and
                  reject contradictions.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="run-summary">
                <span>
                  Last checked <code>{progress.current || 'Preparing…'}</code>
                </span>
                <strong>
                  {progress.candidates.length}{' '}
                  {progress.candidates.length === 1 ? 'candidate' : 'candidates'}
                </strong>
              </div>
              {progress.unresolved > 0 && (
                <p className="error-message">
                  {progress.unresolved} settings exceeded the per-setting work budget. They are
                  unresolved, not rejected.
                </p>
              )}
              {!progress.candidates.length && !running && (
                <p className="muted">
                  No candidates found in the settings tested. Check the crib, offset, rings,
                  reflector, and cable limit.
                </p>
              )}
              {progress.candidates.length > 0 && (
                <>
                  <div className="candidate-tabs" aria-label="Candidate settings">
                    {progress.candidates.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCandidate(index)}
                        aria-pressed={index === selectedCandidate}
                        className={index === selectedCandidate ? 'selected' : ''}
                      >
                        {result.windows}
                        <small>{result.rotors.join('–')}</small>
                      </button>
                    ))}
                  </div>
                  {candidate && (
                    <div className="candidate-detail">
                      <div className="section-heading">
                        <h3>Crib-compatible candidate</h3>
                        <span className="validation-badge">Replay checked</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Start windows</dt>
                          <dd>{candidate.windows}</dd>
                        </div>
                        <div>
                          <dt>Rotor order</dt>
                          <dd>{candidate.rotors.join('–')}</dd>
                        </div>
                        <div>
                          <dt>Plug pairs</dt>
                          <dd>{candidate.pairs.join(' ') || 'No forced pairs'}</dd>
                        </div>
                      </dl>
                      <p className="candidate-plaintext">{candidate.plaintext}</p>
                      <p className="muted">
                        {candidate.unknown.length
                          ? `Unresolved letters: ${candidate.unknown.join(' ')}. They are treated as unplugged in this preview; other completions may exist.`
                          : 'All plugboard letters are constrained for this candidate.'}{' '}
                        A matching crib does not prove that this is the original key.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
        <p className="historical-note">
          <Icon name="book" />
          <span>
            This is a Bombe-inspired constraint search with exact Enigma stepping. Historical Bombes
            used drums, electrical circuits, and a diagonal board to detect potential stops.
          </span>
        </p>
      </div>
    </div>
  );
}
