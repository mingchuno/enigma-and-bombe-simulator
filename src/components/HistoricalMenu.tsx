import { ScrollRegion } from "./ScrollRegion.tsx";
import { useState } from "react";
import type { MenuEdge } from "../engine/bombe.ts";
import { ALPHABET } from "../engine/enigma.ts";
import { EXHIBIT_MENU, relativeLabel } from "../engine/historical.ts";
import { Help } from "./Help.tsx";

const exhibitPositions: Record<string, [number, number]> = {
  N: [445, 30],
  L: [95, 120],
  G: [285, 120],
  E: [445, 120],
  U: [595, 120],
  H: [35, 260],
  Z: [150, 260],
  R: [285, 260],
  V: [445, 260],
  A: [285, 410],
  S: [445, 410],
  W: [595, 410],
};
export function HistoricalMenu({
  edges,
  selected,
  onSelect,
  onIllustrate,
}: {
  edges: MenuEdge[];
  selected: number;
  onSelect: (index: number) => void;
  onIllustrate: (edges: MenuEdge[], selected: number) => void;
}) {
  const [example, setExample] = useState(false);
  const [exampleEdge, setExampleEdge] = useState(0);
  const shown = example ? EXHIBIT_MENU : edges;
  const active = example ? exampleEdge : selected;
  const select = example ? setExampleEdge : onSelect;
  const edge = shown[active];
  return (
    <div className="historical-menu">
      <label className="inline-checkbox">
        <input
          type="checkbox"
          checked={example}
          onChange={(e) => setExample(e.target.checked)}
        />
        Use the supplied museum-menu example
      </label>
      {example ? (
        <>
          <p className="field-hint">
            A redrawn transcription of your diagram, not a crib for the current
            search. Two G–R connections have different position numbers. Scroll
            the diagram sideways on a narrow screen.
          </p>
          <ScrollRegion
            className="operator-diagram-scroll"
            label="Historical menu diagram"
          >
            <svg
              viewBox="0 0 650 470"
              role="img"
              aria-label="Historical menu transcription. N joins E at position 2; G and R have parallel connections at 6 and 12. Use the table below to select each edge."
            >
              {shown.map((item, index) => {
                const a = exhibitPositions[ALPHABET[item.a]],
                  b = exhibitPositions[ALPHABET[item.b]];
                const parallel =
                  item.position === 5 ? -9 : item.position === 11 ? 9 : 0;
                const vertical = a[0] === b[0];
                const x =
                  (a[0] + b[0]) / 2 +
                  (vertical ? (parallel < 0 ? -53 : 16) : 0);
                const y = (a[1] + b[1]) / 2 + (vertical ? 0 : -18);
                return (
                  <g
                    key={item.position}
                    className={
                      index === active
                        ? "operator-edge selected"
                        : "operator-edge"
                    }
                  >
                    <path
                      d={`M${a[0] + parallel} ${a[1]} L${b[0] + parallel} ${b[1]}`}
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor={vertical ? "start" : "middle"}
                    >
                      {item.position + 1}
                    </text>
                    <text
                      className="operator-offset"
                      x={x}
                      y={y + 14}
                      textAnchor={vertical ? "start" : "middle"}
                    >
                      ({relativeLabel(item.position)})
                    </text>
                  </g>
                );
              })}
              {Object.entries(exhibitPositions).map(([letter, [x, y]]) => (
                <g key={letter}>
                  <rect
                    x={x - 13}
                    y={y - 13}
                    width="26"
                    height="26"
                    fill="#fcfbf7"
                  />
                  <text
                    x={x}
                    y={y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    className="operator-letter"
                  >
                    {letter}
                  </text>
                </g>
              ))}
            </svg>
          </ScrollRegion>
          <p className="field-hint">
            The original indicator unit connects to G. It watches 26 possible
            plugboard partners of G; it is not a plaintext output display. The
            13 edges would exceed a single 12-scrambler chain without menu
            selection or extra connections.
          </p>
        </>
      ) : (
        <p className="field-hint">
          Operator-style wiring schedule for your current crib. Each row is one
          labelled line of the menu; identical letters across rows are
          electrically connected. Select a row to connect this notation with the
          graph or drums.
        </p>
      )}
      <ScrollRegion
        className="operator-table-scroll"
        label="Menu wiring schedule"
      >
        <table className="operator-table">
          <caption>
            {example
              ? "Supplied menu transcription"
              : "Current crib wiring schedule"}
          </caption>
          <thead>
            <tr>
              <th>Connection</th>
              <th>Position</th>
              <th>Relative setting</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item, index) => (
              <tr
                key={item.position}
                className={active === index ? "selected" : ""}
              >
                <td>
                  <button
                    aria-label={`Inspect menu connection ${item.position + 1}, ${ALPHABET[item.a]} to ${ALPHABET[item.b]}`}
                    aria-pressed={active === index}
                    onClick={() => select(index)}
                  >
                    {ALPHABET[item.a]} <span aria-hidden="true">────</span>{" "}
                    {ALPHABET[item.b]}
                  </button>
                </td>
                <td>{item.position + 1}</td>
                <td>{relativeLabel(item.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      {edge && (
        <p className="notation-reading">
          <strong>Read it aloud:</strong> “Connect cable {ALPHABET[edge.a]} to
          cable {ALPHABET[edge.b]} through the scrambler for message letter{" "}
          {edge.position + 1}.”{" "}
          {edge.position < 26
            ? `${relativeLabel(edge.position)} is a relative setup mark, not the recovered message key.`
            : "The + offset is shown numerically because another revolution requires explicit turnover assumptions."}
        </p>
      )}
      {example && (
        <button
          className="text-button"
          onClick={() => onIllustrate(shown, active)}
        >
          Put the supplied menu on the drums
        </button>
      )}
      <Help term="ZZZ, ZZA and the numbered lines">
        ZZZ is the reference before the first character. ZZA means one step of
        the bottom drum from that reference; ZZB means two. A line numbered 12
        is a connection for message position 12, not rotor XII. This simple
        notation assumes no middle-rotor turnover within the chosen menu. Our
        exact search handles turnover independently.
      </Help>
    </div>
  );
}
