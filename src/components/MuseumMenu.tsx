import { useState } from "react";
import type { MenuEdge } from "../engine/bombe.ts";
import { ALPHABET } from "../engine/enigma.ts";
import { EXHIBIT_MENU, relativeLabel } from "../engine/historical.ts";
import { HistoricalMenu } from "./HistoricalMenu.tsx";
import { ScrollRegion } from "./ScrollRegion.tsx";

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
export function MuseumMenu({
  onIllustrate,
}: {
  onIllustrate: (edges: MenuEdge[], selected: number) => void;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <section className="learning-panel">
      <h2>Museum example</h2>
      <p className="field-hint">
        A fixed teaching menu, independent of your ciphertext, crib, and search.
        Select a row below to highlight its connection, then explore the wiring
        on the drums. Your live graph and table remain in Crib &amp; search.
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
          {EXHIBIT_MENU.map((item, index) => {
            const a = exhibitPositions[ALPHABET[item.a]],
              b = exhibitPositions[ALPHABET[item.b]];
            const parallel =
              item.position === 5 ? -9 : item.position === 11 ? 9 : 0;
            const vertical = a[0] === b[0];
            const x =
              (a[0] + b[0]) / 2 + (vertical ? (parallel < 0 ? -53 : 16) : 0);
            const y = (a[1] + b[1]) / 2 + (vertical ? 0 : -18);
            return (
              <g
                key={item.position}
                className={
                  index === selected
                    ? "operator-edge selected"
                    : "operator-edge"
                }
              >
                <path
                  d={`M${a[0] + parallel} ${a[1]} L${b[0] + parallel} ${b[1]}`}
                />
                <text x={x} y={y} textAnchor={vertical ? "start" : "middle"}>
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
        Read each letter as a cable junction and each numbered line as a
        connection through the scrambler at that message position. The two G–R
        lines represent positions 6 and 12. The original indicator unit connects
        to G. It watches 26 possible plugboard partners of G; it is not a
        plaintext output display. The 13 edges would exceed a single
        12-scrambler chain without menu selection or extra connections.
      </p>

      <HistoricalMenu
        edges={EXHIBIT_MENU}
        selected={selected}
        onSelect={setSelected}
        caption="Museum example wiring schedule"
      />
      <button
        className="text-button"
        onClick={() => onIllustrate(EXHIBIT_MENU, selected)}
      >
        Put the supplied menu on the drums
      </button>
    </section>
  );
}
