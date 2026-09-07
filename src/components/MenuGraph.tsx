import { cn } from "../lib/cn.ts";
import styles from "./MenuGraph.module.css";
import { ALPHABET } from "../engine/enigma.ts";
import type { MenuEdge } from "../engine/crib-menu.ts";

const GRAPH_WIDTH = 540;
const GRAPH_HEIGHT = 350;
const GRAPH_CENTER_X = GRAPH_WIDTH / 2;
const GRAPH_CENTER_Y = GRAPH_HEIGHT / 2;
const NODE_RADIUS_X = 225;
const NODE_RADIUS_Y = 135;
const NODE_RADIUS = 17;
const EDGE_CURVE_BASE_Y = 150;
const EDGE_CURVE_LANES = 5;
const EDGE_CURVE_SPACING = 12;
const FULL_TURN_RADIANS = 2 * Math.PI;
const TOP_START_ANGLE = -Math.PI / 2;

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
      const angle =
        (index / letters.length) * FULL_TURN_RADIANS + TOP_START_ANGLE;
      return [
        letter,
        {
          x: GRAPH_CENTER_X + NODE_RADIUS_X * Math.cos(angle),
          y: GRAPH_CENTER_Y + NODE_RADIUS_Y * Math.sin(angle),
        },
      ];
    }),
  );
  const selectedEdge = edges[selected];
  return (
    <div className={styles.menuVisual}>
      <svg
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="img"
        aria-label={`Crib menu with ${letters.length} letters and ${edges.length} position constraints. Select a letter pair below to highlight its connection.`}
      >
        {edges.map((edge, index) => {
          const a = points.get(edge.a)!;
          const b = points.get(edge.b)!;
          return (
            <path
              key={index}
              d={`M${a.x} ${a.y} Q${GRAPH_CENTER_X} ${EDGE_CURVE_BASE_Y + (index % EDGE_CURVE_LANES) * EDGE_CURVE_SPACING} ${b.x} ${b.y}`}
              className={cn(styles.menuEdge, {
                [styles.selected]: selected === index,
              })}
            />
          );
        })}
        {letters.map((letter) => {
          const point = points.get(letter)!;
          return (
            <g
              key={letter}
              transform={`translate(${point.x} ${point.y})`}
              className={cn(styles.menuNode, {
                [styles.selected]:
                  selectedEdge &&
                  [selectedEdge.a, selectedEdge.b].includes(letter),
              })}
            >
              <circle r={NODE_RADIUS} />
              <text textAnchor="middle" dominantBaseline="central">
                {ALPHABET[letter]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className={styles.menuCaption}>
        <span>{letters.length} letter nodes</span>
        <span>{edges.length} constraints</span>
        <span>
          <i /> Selected connection
        </span>
      </div>
      <div className={styles.alignment} aria-label="Crib menu letter pairs">
        {edges.map((edge, index) => (
          <button
            key={index}
            className={cn({ [styles.selected]: selected === index })}
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
