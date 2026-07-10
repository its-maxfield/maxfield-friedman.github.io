// Tiny scale helpers so the charts stay dependency-free (no d3 for v1).

/** Map a value from a data domain to a pixel range. */
export function linScale(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** [min, max] of a numeric list, ignoring null/NaN. */
export function extent(vals: Array<number | null | undefined>): [number, number] {
  const nums = vals.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return [0, 1];
  return [Math.min(...nums), Math.max(...nums)];
}

/** Rounded, evenly-spaced tick values across [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step * 0.001; t += step) {
    ticks.push(Math.round(t * 100) / 100);
  }
  return ticks;
}
