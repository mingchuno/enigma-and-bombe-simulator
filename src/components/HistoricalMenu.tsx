import { ScrollRegion } from "./ScrollRegion.tsx";
import type { MenuEdge } from "../engine/bombe.ts";
import { ALPHABET, ALPHABET_SIZE } from "../engine/enigma.ts";
import { relativeLabel } from "../engine/historical.ts";
import { Help } from "./Help.tsx";

export function HistoricalMenu({
  edges,
  selected,
  onSelect,
  caption = "Current crib wiring schedule",
}: {
  edges: MenuEdge[];
  selected: number;
  onSelect: (index: number) => void;
  caption?: string;
}) {
  const edge = edges[selected];
  return (
    <div className="historical-menu">
      <ScrollRegion
        className="operator-table-scroll"
        label="Menu wiring schedule"
      >
        <table className="operator-table">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th>Connection</th>
              <th>Position</th>
              <th>Relative setting</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((item, index) => (
              <tr
                key={item.position}
                className={selected === index ? "selected" : ""}
              >
                <td>
                  <button
                    aria-label={`Inspect menu connection ${item.position + 1}, ${ALPHABET[item.a]} to ${ALPHABET[item.b]}`}
                    aria-pressed={selected === index}
                    onClick={() => onSelect(index)}
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
          {edge.position < ALPHABET_SIZE
            ? `${relativeLabel(edge.position)} is a relative setup mark, not the recovered message key.`
            : "The + offset is shown numerically because another revolution requires explicit turnover assumptions."}
        </p>
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
