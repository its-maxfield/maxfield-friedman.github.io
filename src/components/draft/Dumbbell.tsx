"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { linScale, niceTicks } from "./scale";

export interface DumbbellRow {
  key: string;
  label: string;
  sub?: string;
  a: number;
  b: number;
  /** Per-row endpoint overrides (falls back to the chart-level aColor/bColor). */
  aColor?: string;
  bColor?: string;
  lineColor?: string;
  highlight?: boolean;
  badge?: string;
  tooltip?: React.ReactNode;
}

interface DumbbellProps {
  rows: DumbbellRow[];
  domain: [number, number];
  aColor: string;
  bColor: string;
  aLabel: string;
  bLabel: string;
  showLegend?: boolean;
  axisLabel?: string;
  /** Lower value is "better" — draws the axis high→low. Used for rank axes. */
  invert?: boolean;
  valueFmt?: (n: number) => string;
  rowHeight?: number;
  labelWidth?: number;
}

const W = 680;
const RIGHT_PAD = 56;
const TOP_PAD = 8;
const AXIS_H = 30;
const SURFACE = "var(--color-surface)";
const MUTED = "var(--color-text-muted)";
const BORDER = "var(--color-border)";

export default function Dumbbell({
  rows,
  domain,
  aColor,
  bColor,
  aLabel,
  bLabel,
  showLegend = true,
  axisLabel,
  invert = false,
  valueFmt = (n) => String(Math.round(n)),
  rowHeight = 30,
  labelWidth = 156,
}: DumbbellProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const plotH = rows.length * rowHeight;
  const H = TOP_PAD + plotH + AXIS_H;
  const [d0, d1] = invert ? [domain[1], domain[0]] : domain;
  const x = linScale(d0, d1, labelWidth, W - RIGHT_PAD);
  const ticks = niceTicks(domain[0], domain[1], 5);

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.025 } },
  };
  const rowVar = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <div ref={wrapRef} className="relative overflow-x-auto" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {/* Legend — identity is never color-alone */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 font-mono text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: aColor }} />
            {aLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: bColor }} />
            {bLabel}
          </span>
        </div>
      )}

      <motion.svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ minWidth: 560, display: "block" }}
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        role="img"
        aria-label={`${aLabel} vs ${bLabel} by row`}
      >
        {/* vertical gridlines + axis ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={TOP_PAD} y2={TOP_PAD + plotH} stroke={BORDER} strokeWidth={1} />
            <text x={x(t)} y={H - 10} fill={MUTED} fontSize={11} textAnchor="middle" fontFamily="var(--font-mono)">
              {valueFmt(t)}
            </text>
          </g>
        ))}

        {rows.map((r, i) => {
          const cy = TOP_PAD + i * rowHeight + rowHeight / 2;
          const ax = x(r.a);
          const bx = x(r.b);
          const ac = r.aColor ?? aColor;
          const bc = r.bColor ?? bColor;
          const isHover = hover === i;
          return (
            <motion.g key={r.key} variants={rowVar} onMouseEnter={() => setHover(i)}>
              {/* full-row hover band (bigger than the marks) */}
              <rect x={0} y={cy - rowHeight / 2} width={W} height={rowHeight} fill={isHover ? "var(--color-surface-2)" : "transparent"} opacity={isHover ? 0.5 : 1} />
              {/* row label */}
              <text x={0} y={cy - (r.sub ? 3 : 0)} fill="var(--color-text-primary)" fontSize={12} fontFamily="var(--font-mono)" dominantBaseline="middle">
                {r.label}
              </text>
              {r.sub && (
                <text x={0} y={cy + 10} fill={MUTED} fontSize={10} fontFamily="var(--font-mono)" dominantBaseline="middle">
                  {r.sub}
                </text>
              )}
              {r.badge && (
                <text x={labelWidth - 8} y={cy} fill={MUTED} fontSize={10} textAnchor="end" fontFamily="var(--font-mono)" dominantBaseline="middle">
                  {r.badge}
                </text>
              )}
              {/* connecting line */}
              <line x1={ax} y1={cy} x2={bx} y2={cy} stroke={r.lineColor ?? MUTED} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
              {/* endpoints with 2px surface ring */}
              <circle cx={ax} cy={cy} r={5} fill={ac} stroke={SURFACE} strokeWidth={2} />
              <circle cx={bx} cy={cy} r={5} fill={bc} stroke={SURFACE} strokeWidth={2} />
              {/* highlight ring for team-changers etc. */}
              {r.highlight && <circle cx={bx} cy={cy} r={9} fill="none" stroke={bc} strokeWidth={1.5} opacity={0.7} />}
              {/* selective end value on hover only */}
              {isHover && (
                <text x={W - RIGHT_PAD + 6} y={cy} fill="var(--color-text-primary)" fontSize={11} fontFamily="var(--font-mono)" dominantBaseline="middle">
                  {valueFmt(r.b)}
                </text>
              )}
            </motion.g>
          );
        })}
      </motion.svg>

      {axisLabel && <div className="font-mono text-xs text-text-dim text-center mt-1">{axisLabel}</div>}

      {/* floating tooltip */}
      {hover !== null && rows[hover]?.tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(pos.x + 14, (wrapRef.current?.clientWidth ?? W) - 180), top: pos.y + 14, maxWidth: 220 }}
        >
          {rows[hover].tooltip}
        </div>
      )}
    </div>
  );
}
