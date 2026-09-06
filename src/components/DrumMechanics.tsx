import { useEffect, useMemo, useState } from "react";
import type { MenuEdge } from "../engine/bombe.ts";
import type { MachineConfig, SignalStep } from "../engine/enigma.ts";
import { ALPHABET, Enigma } from "../engine/enigma.ts";
import {
  driveState,
  electricalReachability,
  historicalScramblers,
  relativeLabel,
} from "../engine/historical.ts";
import { Help } from "./Help.tsx";
import { Icon } from "./Icon.tsx";

const drumColors = {
  I: "#a94332",
  II: "#783b49",
  III: "#426d49",
  IV: "#bc952f",
  V: "#765137",
};
const tickPath = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2;
  return `M${40 + 32 * Math.sin(a)} ${40 - 32 * Math.cos(a)}L${40 + 35 * Math.sin(a)} ${40 - 35 * Math.cos(a)}`;
}).join(" ");
function Drum({
  letter,
  orientation,
  color,
}: {
  letter: string;
  orientation: number;
  color: string;
}) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="drum-disc">
      <circle cx="40" cy="40" r="37" fill={color} />
      <g transform={`rotate(${(orientation * 360) / 26} 40 40)`}>
        <path d={tickPath} stroke="#eee2bd" strokeWidth="1.1" />
        <path d="M40 5v10" stroke="#fff9db" strokeWidth="3" />
        <circle cx="40" cy="40" r="24" fill="none" stroke="#d4c38d" />
      </g>
      <circle cx="40" cy="40" r="18" fill="#e3d6b7" />
      <text x="40" y="41" textAnchor="middle" dominantBaseline="central">
        {letter}
      </text>
      <path d="m36 0 4 5 4-5" fill="#fcf5d9" />
    </svg>
  );
}

export function DrumMechanics({
  config,
  edges,
  selected,
  onSelect,
}: {
  config: MachineConfig;
  edges: MenuEdge[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [point, setPoint] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wire, setWire] = useState(0);
  const [diagonal, setDiagonal] = useState(true);
  const [showBoard, setShowBoard] = useState(false);
  const pageStart = Math.floor(selected / 12) * 12;
  const bankEdges = edges.slice(pageStart, pageStart + 12);
  const drive = driveState(point);
  const scramblers = useMemo(
    () => historicalScramblers(config, bankEdges, point),
    [config, bankEdges, point],
  );
  const chosen = scramblers[selected - pageStart] ?? scramblers[0];
  const letters = [...new Set(bankEdges.flatMap((edge) => [edge.a, edge.b]))];
  const register =
    [...letters].sort(
      (a, b) =>
        bankEdges.filter((e) => e.a === b || e.b === b).length -
        bankEdges.filter((e) => e.a === a || e.b === a).length,
    )[0] ?? 0;
  const [registerChoice, setRegisterChoice] = useState<number | null>(null);
  const input =
    registerChoice !== null && letters.includes(registerChoice)
      ? registerChoice
      : register;
  const circuit = useMemo(
    () => electricalReachability(scramblers, input, wire, diagonal),
    [scramblers, input, wire, diagonal],
  );
  const path: SignalStep[] = [];
  if (chosen)
    new Enigma({
      ...config,
      windows: chosen.windows,
      rings: "AAA",
      plugs: "",
    }).scramble(wire, path);
  const rotorPath = path.slice(1, -2);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setPoint((value) => (value + 1) % (39 * 676)),
      180,
    );
    return () => clearInterval(timer);
  }, [playing]);
  function advance() {
    setPlaying(false);
    setPoint((value) => (value + 1) % (39 * 676));
  }
  return (
    <section className="mechanics learning-panel">
      <div className="section-heading">
        <h2>What does a rotating drum change?</h2>
        <span className="validation-badge">39-point drive · slowed down</span>
      </div>
      <p>
        Each <strong>vertical column of three drums</strong> is one Enigma
        scrambler for one menu connection. All top drums rotate together. Their
        motion tries another wiring permutation—it does not type another message
        letter.
      </p>
      <div className="mechanics-controls">
        <button className="primary-button" onClick={() => setPlaying(!playing)}>
          <Icon name={playing ? "close" : "play"} />
          {playing ? "Pause drums" : "Run drums"}
        </button>
        <button onClick={advance}>Advance one point</button>
        <button
          onClick={() => {
            setPlaying(false);
            setPoint(Math.floor(point / 39) * 39 + 26);
          }}
        >
          Show carry phase
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setPoint(0);
          }}
        >
          Reset drive
        </button>
        <label>
          Drive point
          <input
            aria-label="Drive point"
            type="number"
            min={0}
            max={26363}
            value={point}
            onChange={(e) => {
              setPlaying(false);
              setPoint(
                Math.max(
                  0,
                  Math.min(26363, Math.floor(Number(e.target.value))),
                ),
              );
            }}
          />
        </label>
      </div>
      <div className={`drive-phase ${drive.sensing ? "sensing" : "carrying"}`}>
        <strong>
          {drive.sensing
            ? `Sensing point ${drive.phase + 1} of 26`
            : `Carry point ${drive.phase - 25} of 13 — sensing off`}
        </strong>
        <span>
          {drive.sensing
            ? "Read the circuit at this orientation."
            : "The top row keeps rotating while the next row is advanced. Do not interpret the lamps as a stop."}
        </span>
      </div>
      <div className="phase-ruler" aria-hidden="true">
        {Array.from({ length: 39 }, (_, i) => (
          <i
            key={i}
            className={`${i < 26 ? "sense" : "carry"} ${drive.phase === i ? "active" : ""}`}
          />
        ))}
      </div>
      <p className="field-hint">
        The drum letters below are normalized wiring-core coordinates (ring A),
        not the markings engraved on a historical drum. Search ring settings are
        not reused as physical drum settings.
      </p>
      <div className="drum-cabinet">
        <div className="cabinet-heading">
          <strong>One chain · up to 12 scramblers</strong>
          <span>
            Menu connections {pageStart + 1}–{pageStart + bankEdges.length}
          </span>
        </div>
        <p className="cabinet-scroll-hint">
          Select a column to trace its wiring. On a narrow screen, scroll the
          drum bank sideways.
        </p>
        <div className="drum-bank-scroll">
          <div className="drum-bank">
            <div className="drum-row-labels">
              <span>
                Top / Enigma left<strong>Fast search drum</strong>
              </span>
              <span>
                Middle / Enigma middle<strong>Moves on carry</strong>
              </span>
              <span>
                Bottom / Enigma right<strong>Menu offset lives here</strong>
              </span>
            </div>
            {scramblers.map((scrambler, index) => (
              <button
                key={scrambler.position}
                className={`drum-column ${selected === pageStart + index ? "selected" : ""}`}
                onClick={() => onSelect(pageStart + index)}
                aria-pressed={selected === pageStart + index}
                aria-label={`Select scrambler at position ${scrambler.position + 1}, ${ALPHABET[scrambler.a]} to ${ALPHABET[scrambler.b]}, relative setting ${relativeLabel(scrambler.position)}, top core ${scrambler.windows[0]}, middle core ${scrambler.windows[1]}, bottom core ${scrambler.windows[2]}`}
              >
                <span className="drum-connection">
                  {ALPHABET[scrambler.a]}–{ALPHABET[scrambler.b]}
                  <small>#{scrambler.position + 1}</small>
                </span>
                {[0, 1, 2].map((row) => (
                  <Drum
                    key={row}
                    letter={scrambler.windows[row]}
                    orientation={ALPHABET.indexOf(scrambler.windows[row])}
                    color={drumColors[config.rotors[row]]}
                  />
                ))}
                <span className="drum-relative">
                  {relativeLabel(scrambler.position)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="cabinet-footer">
          <span>
            Rotor types top → bottom: {config.rotors.join(" · ")} · reflector{" "}
            {config.reflector}
          </span>
          <span>3 chains × 12 scramblers × 3 drums = 108 drums</span>
        </div>
      </div>
      {edges.length > 12 && (
        <div
          className="chain-pages"
          aria-label="Choose connections to illustrate"
        >
          {Array.from({ length: Math.ceil(edges.length / 12) }, (_, index) => (
            <button
              key={index}
              aria-pressed={pageStart === index * 12}
              onClick={() => {
                setPlaying(false);
                onSelect(index * 12);
              }}
            >
              Connections {index * 12 + 1}–
              {Math.min(index * 12 + 12, edges.length)}
            </button>
          ))}
          <p className="field-hint">
            Pages are teaching subsets, not extra historical banks. Circuit
            sensing below uses only the displayed connections; fewer constraints
            may give extra potential stops.
          </p>
        </div>
      )}
      <div className="mechanics-explanation">
        <div>
          <h3>Why the apparent reversal?</h3>
          <p>
            Enigma advances its right rotor to encipher letters. The Bombe
            sweeps its left-rotor equivalent fastest to search keys while
            retaining the right-rotor offsets between menu connections.
          </p>
        </div>
        <div>
          <h3>26 checks, then a pause in sensing</h3>
          <p>
            The top row turns through 26 contacts, then another 13 points during
            carry. It therefore makes three rotations for every two middle-drum
            steps. All 17,576 orientations are eventually tested.
          </p>
        </div>
      </div>
      {chosen && (
        <div className="drum-inspector">
          <h3>
            Inside column {selected - pageStart + 1}: {ALPHABET[chosen.a]} →{" "}
            {ALPHABET[chosen.b]}, position {chosen.position + 1}
          </h3>
          <p className="core-reading">
            Normalized base{" "}
            {drive.cores.map((value) => ALPHABET[value]).join("")} + bottom-drum
            offset {chosen.position + 1} → {chosen.windows}. The menu mark{" "}
            {relativeLabel(chosen.position)} names that relative offset from
            ZZZ; it is not this core reading.
          </p>
          <p>
            A drum contains two copies of a rotor’s wiring, serving the outward
            and returning current. Four contact circles and 104 brushes allow
            this double-ended arrangement. The reflector joins the two paths;
            the Bombe scrambler has no Enigma plugboard.
          </p>
          <div className="contact-explainer">
            <svg
              viewBox="0 0 190 190"
              role="img"
              aria-label="Four concentric circles of 26 contacts, a schematic of the 104 brushes on a drum"
            >
              <circle cx="95" cy="95" r="90" fill="#e7dfc9" />
              {[36, 51, 66, 81].map((radius, row) => (
                <g key={radius}>
                  {Array.from({ length: 26 }, (_, i) => {
                    const a = ((i + drive.cores[0]) / 26) * Math.PI * 2;
                    return (
                      <circle
                        key={i}
                        cx={95 + radius * Math.sin(a)}
                        cy={95 - radius * Math.cos(a)}
                        r="2.5"
                        fill={row < 2 ? "#305640" : "#916027"}
                      />
                    );
                  })}
                </g>
              ))}
              <circle cx="95" cy="95" r="24" fill="#183b32" />
              <text
                x="95"
                y="95"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f8f0d7"
              >
                104
              </text>
            </svg>
            <div>
              <strong>Two journeys, one rotor type</strong>
              <p>
                Green: outward contact pairs.
                <br />
                Brown: return contact pairs.
                <br />
                Contact geometry is schematic. The letters below come from the
                real rotor permutations at the displayed core orientation.
              </p>
            </div>
          </div>
          <p className="probe-reading">
            Probe wire <b>{ALPHABET[wire]}</b> at cable{" "}
            <b>{ALPHABET[chosen.a]}</b> → emerges on wire{" "}
            <b>{ALPHABET[chosen.mapping[wire]]}</b> at cable{" "}
            <b>{ALPHABET[chosen.b]}</b>.
          </p>
          <ol className="drum-path">
            {rotorPath.map((step, index) => (
              <li key={index}>
                <b>{step.letter}</b>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <section className="sense-panel">
        <div className="section-heading">
          <h3>From rotation to a possible stop</h3>
          <Help term="A stop is not a solved message">
            Voltage spreads through connected scramblers and the diagonal board.
            If all 26 wires in the selected register are reached, reject this
            orientation. If some remain unpowered, the machine has a potential
            stop for checking. A weak menu can produce many such stops.
          </Help>
        </div>
        <div className="sense-controls">
          <label>
            Indicator register
            <select
              aria-label="Indicator register"
              value={input}
              onChange={(e) => setRegisterChoice(Number(e.target.value))}
            >
              {letters.map((letter) => (
                <option key={letter} value={letter}>
                  {ALPHABET[letter]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Inject / probe wire
            <select
              aria-label="Inject wire"
              value={wire}
              onChange={(e) => setWire(Number(e.target.value))}
            >
              {[...ALPHABET].map((letter, index) => (
                <option key={letter} value={index}>
                  {letter}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={diagonal}
              onChange={(e) => setDiagonal(e.target.checked)}
            />
            Connect diagonal board
          </label>
        </div>
        <p className="field-hint">
          Injecting wire {ALPHABET[wire]} at register {ALPHABET[input]} tests
          the hypothesis that the plugboard pairs {ALPHABET[input]} with{" "}
          {ALPHABET[wire]}. The column probe above uses that same wire as a
          separate local example.
        </p>
        <div
          className={`sense-lamps ${drive.sensing ? "" : "inactive"}`}
          aria-label="Indicator register wires"
        >
          {[...ALPHABET].map((letter, index) => (
            <span
              key={letter}
              className={
                drive.sensing && circuit.live[input * 26 + index]
                  ? "energized"
                  : ""
              }
            >
              {letter}
              <small>
                {!drive.sensing
                  ? "—"
                  : circuit.live[input * 26 + index]
                    ? "on"
                    : "off"}
              </small>
            </span>
          ))}
        </div>
        <p className="sense-verdict" aria-live={playing ? "off" : "polite"}>
          {!drive.sensing
            ? "Not sensing during carry."
            : `${circuit.registerCount} of 26 register wires energized — ${circuit.registerCount === 26 ? "reject this orientation." : "potential stop; further checking required."}`}
        </p>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={showBoard}
            onChange={(e) => setShowBoard(e.target.checked)}
          />
          Show all 676 diagonal-board terminals
        </label>
        {showBoard && (
          <div className="diagonal-scroll">
            <svg
              viewBox="0 0 365 365"
              role="img"
              aria-label={`${drive.sensing ? circuit.energized : 0} energized terminals; rows are cable letters and columns are possible plugboard partners.`}
            >
              {[...ALPHABET].map((letter, index) => (
                <g key={letter}>
                  <text x="8" y={32 + index * 12} className="board-label">
                    {letter}
                  </text>
                  <text x={28 + index * 12} y="12" className="board-label">
                    {letter}
                  </text>
                </g>
              ))}
              {circuit.live.map((live, index) => (
                <rect
                  key={index}
                  x={23 + (index % 26) * 12}
                  y={23 + Math.floor(index / 26) * 12}
                  width="10"
                  height="10"
                  fill={drive.sensing && live ? "#986420" : "#dce4d4"}
                />
              ))}
            </svg>
            <p className="field-hint">
              Rows name cables; columns name possible partners. The permanent
              reciprocal link joins (A, B) to (B, A). This square layout
              explains the wiring; the actual rear-board sockets were not laid
              out as this grid.
            </p>
          </div>
        )}
      </section>
      <p className="scope-note">
        This mode models drive phases, relative drum offsets, and electrical
        reachability. Display letters are normalized core coordinates (ring A),
        not calibrated letters engraved on historical drums or the search’s
        starting windows. It assumes no middle-rotor turnover inside the menu;
        large offsets are schematic. Carry movement is drawn at its boundary;
        gearing, physical rotation direction, and braking are illustrative. The
        exact search retains its own Enigma stepping and results.
      </p>
      <p className="source-line">
        <a
          href="https://bombe.virtualcolossus.co.uk/technical.html"
          target="_blank"
          rel="noreferrer"
        >
          Virtual Bombe technical reconstruction
        </a>{" "}
        ·{" "}
        <a
          href="https://www.tnmoc.org/bh-10-bombe-description"
          target="_blank"
          rel="noreferrer"
        >
          TNMOC machine description
        </a>
      </p>
    </section>
  );
}
