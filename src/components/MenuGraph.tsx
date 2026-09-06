import { ALPHABET } from "../engine/enigma.ts";
import type { MenuEdge } from "../engine/bombe.ts";

export function MenuGraph({
  edges,
  selected,
  onSelect,
}: {
  edges: MenuEdge[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const letters = [...new Set(edges.flatMap((edge) => [edge.a, edge.b]))].sort(
    (a, b) => a - b,
  );
  const points = new Map(
    letters.map((letter, index) => {
      const angle = (index / letters.length) * Math.PI * 2 - Math.PI / 2;
      return [
        letter,
        { x: 270 + 225 * Math.cos(angle), y: 175 + 135 * Math.sin(angle) },
      ];
    }),
  );
  const selectedEdge = edges[selected];
  return (
    <div className="menu-visual">
      <svg
        viewBox="0 0 540 350"
        role="img"
        aria-label={`Crib menu with ${letters.length} letters and ${edges.length} position constraints. Select a letter pair below to highlight its connection.`}
      >
        {edges.map((edge, index) => {
          const a = points.get(edge.a)!;
          const b = points.get(edge.b)!;
          return (
            <path
              key={index}
              d={`M${a.x} ${a.y} Q270 ${150 + (index % 5) * 12} ${b.x} ${b.y}`}
              className={
                selected === index ? "menu-edge selected" : "menu-edge"
              }
            />
          );
        })}
        {letters.map((letter) => {
          const point = points.get(letter)!;
          return (
            <g
              key={letter}
              transform={`translate(${point.x} ${point.y})`}
              className={
                selectedEdge &&
                [selectedEdge.a, selectedEdge.b].includes(letter)
                  ? "menu-node selected"
                  : "menu-node"
              }
            >
              <circle r="17" />
              <text textAnchor="middle" dominantBaseline="central">
                {ALPHABET[letter]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="menu-caption">
        <span>{letters.length} letter nodes</span>
        <span>{edges.length} constraints</span>
        <span>
          <i /> Selected connection
        </span>
      </div>
      <div className="alignment" aria-label="Crib menu letter pairs">
        {edges.map((edge, index) => (
          <button
            key={index}
            className={selected === index ? "selected" : ""}
            aria-label={`Position ${edge.position + 1}: ${ALPHABET[edge.a]} to ${ALPHABET[edge.b]}`}
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
          >
            <small>{edge.position + 1}</small>
            <b>{ALPHABET[edge.a]}</b>
            <span>{ALPHABET[edge.b]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
