/** Geometry for pointer arrows drawn between measured memory cells. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArrowGeometry {
  /** Cubic bezier path data. */
  d: string;
  /** Arrowhead tip position and heading, in degrees. */
  tip: { x: number; y: number; angle: number };
  /** Midpoint of the curve — where a label sits. */
  mid: { x: number; y: number };
}

const GAP = 7; // breathing room between a cell edge and the curve

/**
 * Routes a curve from the edge of `from` to the edge of `to`.
 *
 * Leaves and enters through whichever pair of faces keeps the curve short:
 * vertical faces when the cells are stacked (a frame pointing into a frame
 * below it), horizontal faces when they sit side by side (a pointer next to
 * the variable it references).
 */
/**
 * A cell that points at itself — a self-referencing object, a node whose next
 * is itself. Loops over the top of the box rather than routing sideways.
 */
export function selfLoopGeometry(box: Box): ArrowGeometry {
  const height = 30;
  const p0 = { x: box.x + box.w * 0.68, y: box.y - GAP };
  const p1 = { x: box.x + box.w * 0.32, y: box.y - GAP };
  const c0 = { x: box.x + box.w * 1.05, y: box.y - height };
  const c1 = { x: box.x - box.w * 0.05, y: box.y - height };

  return {
    d: `M ${r(p0.x)} ${r(p0.y)} C ${r(c0.x)} ${r(c0.y)}, ${r(c1.x)} ${r(c1.y)}, ${r(p1.x)} ${r(p1.y)}`,
    tip: { ...p1, angle: (Math.atan2(p1.y - c1.y, p1.x - c1.x) * 180) / Math.PI },
    mid: { x: box.x + box.w / 2, y: box.y - height * 0.78 },
  };
}

export function arrowGeometry(from: Box, to: Box): ArrowGeometry {
  const sc = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const tc = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;

  // Prefer vertical routing once the cells are more than a cell-height apart;
  // side-by-side cells stay horizontal even when slightly misaligned.
  const vertical = Math.abs(dy) > Math.max(from.h, to.h) * 0.8;

  let p0: { x: number; y: number };
  let p1: { x: number; y: number };
  let c0: { x: number; y: number };
  let c1: { x: number; y: number };

  if (vertical) {
    const down = dy > 0;
    p0 = { x: sc.x, y: down ? from.y + from.h + GAP : from.y - GAP };
    p1 = { x: tc.x, y: down ? to.y - GAP : to.y + to.h + GAP };
    const k = Math.max(26, Math.abs(p1.y - p0.y) * 0.45);
    c0 = { x: p0.x, y: p0.y + (down ? k : -k) };
    c1 = { x: p1.x, y: p1.y - (down ? k : -k) };
  } else {
    const right = dx >= 0;
    p0 = { x: right ? from.x + from.w + GAP : from.x - GAP, y: sc.y };
    p1 = { x: right ? to.x - GAP : to.x + to.w + GAP, y: tc.y };
    const k = Math.max(26, Math.abs(p1.x - p0.x) * 0.45);
    c0 = { x: p0.x + (right ? k : -k), y: p0.y };
    c1 = { x: p1.x - (right ? k : -k), y: p1.y };
  }

  const d = `M ${r(p0.x)} ${r(p0.y)} C ${r(c0.x)} ${r(c0.y)}, ${r(c1.x)} ${r(c1.y)}, ${r(p1.x)} ${r(p1.y)}`;

  // Heading at the tip is the tangent, i.e. the last control point -> endpoint.
  const angle = (Math.atan2(p1.y - c1.y, p1.x - c1.x) * 180) / Math.PI;

  // Bezier at t = 0.5 simplifies to (p0 + 3c0 + 3c1 + p1) / 8.
  const mid = {
    x: (p0.x + 3 * c0.x + 3 * c1.x + p1.x) / 8,
    y: (p0.y + 3 * c0.y + 3 * c1.y + p1.y) / 8,
  };

  return { d, tip: { ...p1, angle }, mid };
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}

export function boxesEqual(a: Record<string, Box>, b: Record<string, Box>) {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    const x = a[k];
    const y = b[k];
    if (!y) return false;
    if (x.x !== y.x || x.y !== y.y || x.w !== y.w || x.h !== y.h) return false;
  }
  return true;
}
