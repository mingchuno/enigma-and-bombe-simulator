import styles from "./DrumMechanics.module.css";
import { ScrollRegion } from "./ScrollRegion.tsx";
import { useEffect, useMemo, useState } from "react";
import type { MenuEdge } from "../engine/crib-menu.ts";
import type { MachineConfig, SignalStep } from "../engine/enigma.ts";
import {
  ALPHABET,
  ALPHABET_SIZE,
  Enigma,
  ROTOR_SLOT,
  ROTOR_SLOTS,
} from "../engine/enigma.ts";
import {
  DRIVE_POINT_COUNT,
  DRIVE_POINTS_PER_CYCLE,
  SENSING_POINTS,
  CARRY_POINTS,
  SCRAMBLERS_PER_CHAIN,
  DIAGONAL_BOARD_TERMINAL_COUNT,
  driveState,
  electricalReachability,
  historicalScramblers,
  relativeLabel,
} from "../engine/historical.ts";
import { Help } from "./Help.tsx";
import { Icon } from "./Icon.tsx";

const DRIVE_ANIMATION_INTERVAL_MS = 180;
const FULL_TURN_DEGREES = 360;
const FULL_TURN_RADIANS = 2 * Math.PI;
const DRUM_CENTER = 40;
const DRUM_TICK_INNER_RADIUS = 32;
const DRUM_TICK_OUTER_RADIUS = 35;
const CONTACT_CIRCLE_RADII = [36, 51, 66, 81];
const CONTACT_DIAGRAM_CENTER = 95;
const OUTWARD_CONTACT_CIRCLES = 2;
const BOARD_CELL_SPACING = 12;
const BOARD_CELL_ORIGIN = 23;
const BOARD_ROW_LABEL_BASELINE = 32;
const BOARD_COLUMN_LABEL_CENTER = 28;
// scramble() records the entry plugboard, then the rotor circuit, exit plugboard and lamp.
const ENTRY_PLUGBOARD_STEPS = 1;
const EXIT_PLUGBOARD_AND_LAMP_STEPS = 2;

const tickPath = Array.from({ length: ALPHABET_SIZE }, (_, i) => {
  const a = (i / ALPHABET_SIZE) * FULL_TURN_RADIANS;
  return `M${DRUM_CENTER + DRUM_TICK_INNER_RADIUS * Math.sin(a)} ${DRUM_CENTER - DRUM_TICK_INNER_RADIUS * Math.cos(a)}L${DRUM_CENTER + DRUM_TICK_OUTER_RADIUS * Math.sin(a)} ${DRUM_CENTER - DRUM_TICK_OUTER_RADIUS * Math.cos(a)}`;
}).join(" ");
function Drum({
  letter,
  orientation,
  rotor,
}: {
  letter: string;
  orientation: number;
  rotor: MachineConfig["rotors"][number];
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden="true"
      className={styles.drumDisc}
      data-rotor={rotor}
    >
      <circle
        cx={DRUM_CENTER}
        cy={DRUM_CENTER}
        r="37"
        className={styles.drumShell}
      />
      <g
        transform={`rotate(${(orientation * FULL_TURN_DEGREES) / ALPHABET_SIZE} ${DRUM_CENTER} ${DRUM_CENTER})`}
      >
        <path d={tickPath} stroke="#eee2bd" strokeWidth="1.1" />
        <path d="M40 5v10" stroke="#fff9db" strokeWidth="3" />
        <circle
          cx={DRUM_CENTER}
          cy={DRUM_CENTER}
          r="24"
          fill="none"
          stroke="#d4c38d"
        />
      </g>
      <circle cx={DRUM_CENTER} cy={DRUM_CENTER} r="18" fill="#e3d6b7" />
      <text
        x={DRUM_CENTER}
        y={DRUM_CENTER + 1}
        textAnchor="middle"
        dominantBaseline="central"
      >
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
  const pageStart =
    Math.floor(selected / SCRAMBLERS_PER_CHAIN) * SCRAMBLERS_PER_CHAIN;
  const bankEdges = edges.slice(pageStart, pageStart + SCRAMBLERS_PER_CHAIN);
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
  const rotorPath = path.slice(
    ENTRY_PLUGBOARD_STEPS,
    -EXIT_PLUGBOARD_AND_LAMP_STEPS,
  );
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setPoint((value) => (value + 1) % DRIVE_POINT_COUNT),
      DRIVE_ANIMATION_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [playing]);
  function advance() {
    setPlaying(false);
    setPoint((value) => (value + 1) % DRIVE_POINT_COUNT);
  }
  return (
    <section className={styles.learningPanel}>
      <div className={styles.sectionHeading}>
        <h2>What does a rotating drum change?</h2>
        <span className={styles.validationBadge}>
          {DRIVE_POINTS_PER_CYCLE}-point drive · slowed down
        </span>
      </div>
      <p>
        Each <strong>vertical column of three drums</strong> is one Enigma
        scrambler for one menu connection. All top drums rotate together. Their
        motion tries another wiring permutation—it does not type another message
        letter.
      </p>
      <div className={styles.mechanicsControls}>
        <button
          className={styles.primaryButton}
          onClick={() => setPlaying(!playing)}
        >
          <Icon name={playing ? "close" : "play"} />
          {playing ? "Pause drums" : "Run drums"}
        </button>
        <button onClick={advance}>Advance one point</button>
        <button
          onClick={() => {
            setPlaying(false);
            setPoint(
              Math.floor(point / DRIVE_POINTS_PER_CYCLE) *
                DRIVE_POINTS_PER_CYCLE +
                SENSING_POINTS,
            );
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
            max={DRIVE_POINT_COUNT - 1}
            value={point}
            onChange={(e) => {
              setPlaying(false);
              setPoint(
                Math.max(
                  0,
                  Math.min(
                    DRIVE_POINT_COUNT - 1,
                    Math.floor(Number(e.target.value)),
                  ),
                ),
              );
            }}
          />
        </label>
      </div>
      <div
        data-testid="drive-phase"
        className={styles.drivePhase}
        data-phase={drive.sensing ? "sensing" : "carrying"}
      >
        <strong>
          {drive.sensing
            ? `Sensing point ${drive.phase + 1} of ${SENSING_POINTS}`
            : `Carry point ${drive.phase - SENSING_POINTS + 1} of ${CARRY_POINTS} — sensing off`}
        </strong>
        <span>
          {drive.sensing
            ? "Read the circuit at this orientation."
            : "The top row keeps rotating while the next row is advanced. Do not interpret the lamps as a stop."}
        </span>
      </div>
      <div className={styles.phaseRuler} aria-hidden="true">
        {Array.from({ length: DRIVE_POINTS_PER_CYCLE }, (_, i) => (
          <i
            key={i}
            data-phase={i < SENSING_POINTS ? "sensing" : "carrying"}
            className={drive.phase === i ? styles.active : ""}
          />
        ))}
      </div>
      <p className={styles.fieldHint}>
        The drum letters below are normalized wiring-core coordinates (ring A),
        not the markings engraved on a historical drum. Search ring settings are
        not reused as physical drum settings.
      </p>
      <div className={styles.drumCabinet}>
        <div className={styles.cabinetHeading}>
          <strong>One chain · up to {SCRAMBLERS_PER_CHAIN} scramblers</strong>
          <span>
            Menu connections {pageStart + 1}–{pageStart + bankEdges.length}
          </span>
        </div>
        <p className={styles.cabinetScrollHint}>
          Select a column to trace its wiring. On a narrow screen, scroll the
          drum bank sideways.
        </p>
        <ScrollRegion className={styles.drumBankScroll} label="Drum bank">
          <div className={styles.drumBank}>
            <div className={styles.drumRowLabels}>
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
                className={`${styles.drumColumn} ${selected === pageStart + index ? styles.selected : ""}`}
                onClick={() => onSelect(pageStart + index)}
                aria-pressed={selected === pageStart + index}
                aria-label={`Select scrambler at position ${scrambler.position + 1}, ${ALPHABET[scrambler.a]} to ${ALPHABET[scrambler.b]}, relative setting ${relativeLabel(scrambler.position)}, top core ${scrambler.windows[ROTOR_SLOT.LEFT]}, middle core ${scrambler.windows[ROTOR_SLOT.MIDDLE]}, bottom core ${scrambler.windows[ROTOR_SLOT.RIGHT]}`}
              >
                <span className={styles.drumConnection}>
                  {ALPHABET[scrambler.a]}–{ALPHABET[scrambler.b]}
                  <small>#{scrambler.position + 1}</small>
                </span>
                {ROTOR_SLOTS.map((row) => (
                  <Drum
                    key={row}
                    letter={scrambler.windows[row]}
                    orientation={ALPHABET.indexOf(scrambler.windows[row])}
                    rotor={config.rotors[row]}
                  />
                ))}
                <span className={styles.drumRelative}>
                  {relativeLabel(scrambler.position)}
                </span>
              </button>
            ))}
          </div>
        </ScrollRegion>
        <div className={styles.cabinetFooter}>
          <span>
            Rotor types top → bottom: {config.rotors.join(" · ")} · reflector{" "}
            {config.reflector}
          </span>
          <span>3 chains × 12 scramblers × 3 drums = 108 drums</span>
        </div>
      </div>
      {edges.length > SCRAMBLERS_PER_CHAIN && (
        <div
          className={styles.chainPages}
          aria-label="Choose connections to illustrate"
        >
          {Array.from(
            { length: Math.ceil(edges.length / SCRAMBLERS_PER_CHAIN) },
            (_, index) => (
              <button
                key={index}
                aria-pressed={pageStart === index * SCRAMBLERS_PER_CHAIN}
                onClick={() => {
                  setPlaying(false);
                  onSelect(index * SCRAMBLERS_PER_CHAIN);
                }}
              >
                Connections {index * SCRAMBLERS_PER_CHAIN + 1}–
                {Math.min(
                  index * SCRAMBLERS_PER_CHAIN + SCRAMBLERS_PER_CHAIN,
                  edges.length,
                )}
              </button>
            ),
          )}
          <p className={styles.fieldHint}>
            Pages are teaching subsets, not extra historical banks. Circuit
            sensing below uses only the displayed connections; fewer constraints
            may give extra potential stops.
          </p>
        </div>
      )}
      <div className={styles.mechanicsExplanation}>
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
        <div className={styles.drumInspector}>
          <h3>
            Inside column {selected - pageStart + 1}: {ALPHABET[chosen.a]} →{" "}
            {ALPHABET[chosen.b]}, position {chosen.position + 1}
          </h3>
          <p className={styles.coreReading}>
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
          <div className={styles.contactExplainer}>
            <svg
              viewBox="0 0 190 190"
              role="img"
              aria-label="Four concentric circles of 26 contacts, a schematic of the 104 brushes on a drum"
            >
              <circle
                cx={CONTACT_DIAGRAM_CENTER}
                cy={CONTACT_DIAGRAM_CENTER}
                r="90"
                fill="#e7dfc9"
              />
              {CONTACT_CIRCLE_RADII.map((radius, row) => (
                <g key={radius}>
                  {Array.from({ length: ALPHABET_SIZE }, (_, i) => {
                    const a =
                      ((i + drive.cores[ROTOR_SLOT.LEFT]) / ALPHABET_SIZE) *
                      FULL_TURN_RADIANS;
                    return (
                      <circle
                        key={i}
                        cx={CONTACT_DIAGRAM_CENTER + radius * Math.sin(a)}
                        cy={CONTACT_DIAGRAM_CENTER - radius * Math.cos(a)}
                        r="2.5"
                        className={styles.contact}
                        data-direction={
                          row < OUTWARD_CONTACT_CIRCLES ? "outward" : "return"
                        }
                      />
                    );
                  })}
                </g>
              ))}
              <circle
                cx={CONTACT_DIAGRAM_CENTER}
                cy={CONTACT_DIAGRAM_CENTER}
                r="24"
                fill="#183b32"
              />
              <text
                x={CONTACT_DIAGRAM_CENTER}
                y={CONTACT_DIAGRAM_CENTER}
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
          <p>
            Probe wire <b>{ALPHABET[wire]}</b> at cable{" "}
            <b>{ALPHABET[chosen.a]}</b> → emerges on wire{" "}
            <b>{ALPHABET[chosen.mapping[wire]]}</b> at cable{" "}
            <b>{ALPHABET[chosen.b]}</b>.
          </p>
          <ol className={styles.drumPath}>
            {rotorPath.map((step, index) => (
              <li key={index}>
                <b>{step.letter}</b>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <section className={styles.sensePanel}>
        <div className={styles.sectionHeading}>
          <h3>From rotation to a possible stop</h3>
          <Help term="A stop is not a solved message">
            Voltage spreads through connected scramblers and the diagonal board.
            If all 26 wires in the selected register are reached, reject this
            orientation. If some remain unpowered, the machine has a potential
            stop for checking. A weak menu can produce many such stops.
          </Help>
        </div>
        <div className={styles.senseControls}>
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
          <label className={styles.inlineCheckbox}>
            <input
              type="checkbox"
              checked={diagonal}
              onChange={(e) => setDiagonal(e.target.checked)}
            />
            Connect diagonal board
          </label>
        </div>
        <p className={styles.fieldHint}>
          Injecting wire {ALPHABET[wire]} at register {ALPHABET[input]} tests
          the hypothesis that the plugboard pairs {ALPHABET[input]} with{" "}
          {ALPHABET[wire]}. The column probe above uses that same wire as a
          separate local example.
        </p>
        <div
          className={`${styles.senseLamps} ${drive.sensing ? "" : styles.inactive}`}
          aria-label="Indicator register wires"
        >
          {[...ALPHABET].map((letter, index) => (
            <span
              key={letter}
              className={
                drive.sensing && circuit.live[input * ALPHABET_SIZE + index]
                  ? styles.energized
                  : ""
              }
            >
              {letter}
              <small>
                {!drive.sensing
                  ? "—"
                  : circuit.live[input * ALPHABET_SIZE + index]
                    ? "on"
                    : "off"}
              </small>
            </span>
          ))}
        </div>
        <p
          data-testid="sense-verdict"
          className={styles.senseVerdict}
          aria-live={playing ? "off" : "polite"}
        >
          {!drive.sensing
            ? "Not sensing during carry."
            : `${circuit.registerCount} of ${ALPHABET_SIZE} register wires energized — ${circuit.registerCount === ALPHABET_SIZE ? "reject this orientation." : "potential stop; further checking required."}`}
        </p>
        <label className={styles.inlineCheckbox}>
          <input
            type="checkbox"
            checked={showBoard}
            onChange={(e) => setShowBoard(e.target.checked)}
          />
          Show all {DIAGONAL_BOARD_TERMINAL_COUNT} diagonal-board terminals
        </label>
        {showBoard && (
          <div data-testid="diagonal-scroll" className={styles.diagonalScroll}>
            <svg
              viewBox="0 0 365 365"
              role="img"
              aria-label={`${drive.sensing ? circuit.energized : 0} energized terminals; rows are cable letters and columns are possible plugboard partners.`}
            >
              {[...ALPHABET].map((letter, index) => (
                <g key={letter}>
                  <text
                    x="8"
                    y={BOARD_ROW_LABEL_BASELINE + index * BOARD_CELL_SPACING}
                    className={styles.boardLabel}
                  >
                    {letter}
                  </text>
                  <text
                    x={BOARD_COLUMN_LABEL_CENTER + index * BOARD_CELL_SPACING}
                    y="12"
                    className={styles.boardLabel}
                  >
                    {letter}
                  </text>
                </g>
              ))}
              {circuit.live.map((live, index) => (
                <rect
                  key={index}
                  x={
                    BOARD_CELL_ORIGIN +
                    (index % ALPHABET_SIZE) * BOARD_CELL_SPACING
                  }
                  y={
                    BOARD_CELL_ORIGIN +
                    Math.floor(index / ALPHABET_SIZE) * BOARD_CELL_SPACING
                  }
                  width="10"
                  height="10"
                  className={styles.boardTerminal}
                  data-energized={Boolean(drive.sensing && live)}
                />
              ))}
            </svg>
            <p className={styles.fieldHint}>
              Rows name cables; columns name possible partners. With the board
              connected, the reciprocal link joins (A, B) to (B, A). This square
              layout explains the wiring; the actual rear-board sockets were not
              laid out as this grid.
            </p>
          </div>
        )}
      </section>
      <p className={styles.scopeNote}>
        This mode models drive phases, relative drum offsets, and electrical
        reachability. Display letters are normalized core coordinates (ring A),
        not calibrated letters engraved on historical drums or the search’s
        starting windows. It assumes no middle-rotor turnover inside the menu;
        large offsets are schematic. Carry movement is drawn at its boundary;
        gearing, physical rotation direction, and braking are illustrative.
        Animation continues through potential stops so you can inspect them;
        automatic stop-and-cancel relay timing is not simulated. The exact
        search retains its own Enigma stepping and results.
      </p>
      <p className={styles.sourceLine}>
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
