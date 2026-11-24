export type SpringProp = 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz' | 's' | 'o' | 'open';

export type BookPose = Record<SpringProp, number>;

export interface BookSpringState {
  p: BookPose;
  v: BookPose;
}

export const SPRING_STIFFNESS: Record<SpringProp, number> = {
  x: 120,
  y: 120,
  z: 140,
  rx: 160,
  ry: 160,
  rz: 120,
  s: 170,
  o: 90,
  open: 110,
};

export const SPRING_DAMPING: Record<SpringProp, number> = {
  x: 17,
  y: 17,
  z: 20,
  rx: 18,
  ry: 18,
  rz: 15,
  s: 21,
  o: 19,
  open: 20,
};

const SPRING_PROPS: readonly SpringProp[] = [
  'x',
  'y',
  'z',
  'rx',
  'ry',
  'rz',
  's',
  'o',
  'open',
];

export function createBookSpringState(initial: BookPose): BookSpringState {
  return {
    p: { ...initial },
    v: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 0, o: 0, open: 0 },
  };
}

export function integrateBookSpring(
  state: BookSpringState,
  target: BookPose,
  dtRaw: number,
): void {
  const dt = Math.min(Math.max(dtRaw, 0), 0.033);
  if (dt === 0) return;

  const substeps = 4;
  const h = dt / substeps;

  for (let step = 0; step < substeps; step += 1) {
    for (let i = 0; i < SPRING_PROPS.length; i += 1) {
      const prop = SPRING_PROPS[i];
      const k = SPRING_STIFFNESS[prop];
      const c = SPRING_DAMPING[prop];
      const disp = state.p[prop] - target[prop];
      const acc = -k * disp - c * state.v[prop];
      state.v[prop] += acc * h;
      state.p[prop] += state.v[prop] * h;
    }
  }
}

export interface BookDimensions {
  bw: number;
  bh: number;
  d: number;
  isMobile: boolean;
}

export function getBookDimensions(viewportWidth: number): BookDimensions {
  const isMobile = viewportWidth < 760;
  const bw = isMobile
    ? Math.min(viewportWidth * 0.3, 140)
    : Math.min(230, Math.max(130, viewportWidth * 0.128));
  const bh = bw * 1.327;
  const d = bw * 0.085;
  return { bw, bh, d, isMobile };
}

export interface RingPoint {
  x: number;
  y: number;
  len: number;
}

export interface RingTable {
  points: RingPoint[];
  totalLength: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export function buildRingTable(
  viewportWidth: number,
  viewportHeight: number,
  samples = 720,
): RingTable {
  const isMobile = viewportWidth < 760;
  const cx = viewportWidth * 0.5;
  const cy = viewportHeight * 0.53;
  const rx = viewportWidth * (isMobile ? 0.5 : 0.42);
  const ry = viewportHeight * (isMobile ? 0.42 : 0.43);

  const points: RingPoint[] = [];
  let totalLength = 0;
  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i <= samples; i += 1) {
    const theta = (i / samples) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = cx + rx * Math.sign(cos) * Math.pow(Math.abs(cos), 0.5);
    const y = cy + ry * Math.sign(sin) * Math.pow(Math.abs(sin), 0.5);

    if (i > 0) {
      totalLength += Math.hypot(x - prevX, y - prevY);
    }
    points.push({ x, y, len: totalLength });
    prevX = x;
    prevY = y;
  }

  return { points, totalLength, cx, cy, rx, ry };
}

export function sampleRingAt(table: RingTable, uRaw: number): { x: number; y: number } {
  const u = ((uRaw % 1) + 1) % 1;
  const targetLen = u * table.totalLength;
  const pts = table.points;

  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].len <= targetLen) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const p0 = pts[lo];
  const p1 = pts[hi];
  const span = p1.len - p0.len;
  const alpha = span > 1e-6 ? (targetLen - p0.len) / span : 0;

  return {
    x: p0.x + (p1.x - p0.x) * alpha,
    y: p0.y + (p1.y - p0.y) * alpha,
  };
}

export interface OrbitTargetParams {
  ring: RingTable;
  dims: BookDimensions;
  viewportWidth: number;
  viewportHeight: number;
  activeSlot: number;
  activeCount: number;
  phase: number;
  time: number;
  bookIndex: number;
  seed: number;
  baseTilt: number;
  mx: number;
  my: number;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  isHovered: boolean;
}

export function computeOrbitTarget(params: OrbitTargetParams): BookPose {
  const {
    ring,
    dims,
    viewportWidth,
    viewportHeight,
    activeSlot,
    activeCount,
    phase,
    time,
    bookIndex,
    seed,
    baseTilt,
    mx,
    my,
    pointerX,
    pointerY,
    pointerActive,
    isHovered,
  } = params;

  const u = phase / (Math.PI * 2) + activeSlot / Math.max(activeCount, 1);
  const pt = sampleRingAt(ring, u);

  let x = pt.x;
  let y = pt.y;
  let s = 1;
  let z = 0;
  let open = 0;

  // Top clearance: lift & shrink books crossing the top center so wordmark/search remain unobstructed.
  const dxCenter = Math.abs(x - ring.cx);
  const clearanceHalfWidth = 0.2 * viewportWidth;
  if (y < ring.cy && dxCenter < clearanceHalfWidth) {
    const norm = dxCenter / clearanceHalfWidth;
    const bell = Math.pow(1 - norm * norm, 1.4);
    y -= bell * (0.17 * viewportHeight + 0.35 * dims.bh);
    s *= 1 - 0.25 * bell;
  }

  // Depth parallax + gentle organic bob and sway.
  const depth = 0.6 + seed * 0.8;
  x += (mx - 0.5) * -38 * depth;
  y += (my - 0.5) * -26 * depth;
  y += Math.sin(time * 0.7 + bookIndex * 1.7) * 5;

  let rz = baseTilt + Math.sin(time * 0.55 + bookIndex * 1.3) * 2.4;
  const rx = (my - 0.5) * -16;
  const ry = (mx - 0.5) * 22;

  // Cursor repel within 1.25 * BW (skipped while directly hovered so cursor stays locked on book).
  if (pointerActive && !isHovered) {
    const rxDist = x - pointerX;
    const ryDist = y - pointerY;
    const dist = Math.hypot(rxDist, ryDist);
    const radius = 1.25 * dims.bw;
    if (dist > 0.001 && dist < radius) {
      const push = (1 - dist / radius) * 0.35 * dims.bw;
      x += (rxDist / dist) * push;
      y += (ryDist / dist) * push;
    }
  }

  if (isHovered) {
    z = 70;
    s *= 1.07;
    rz *= 0.45;
    open = 0.06;
  }

  return {
    x,
    y,
    z,
    rx,
    ry,
    rz,
    s,
    o: 1,
    open,
  };
}

export interface GridTargetParams {
  dims: BookDimensions;
  viewportWidth: number;
  viewportHeight: number;
  activeSlot: number;
  activeCount: number;
  mx: number;
  my: number;
  isHovered: boolean;
}

export function computeGridTarget(params: GridTargetParams): BookPose {
  const { dims, viewportWidth, viewportHeight, activeSlot, activeCount, mx, my, isHovered } =
    params;

  const cols = dims.isMobile ? 3 : 6;
  const rows = Math.max(1, Math.ceil(activeCount / cols));
  const maxScaleByHeight = dims.isMobile
    ? (0.122 * viewportHeight) / dims.bh
    : (0.22 * viewportHeight) / dims.bh;
  const baseScale = Math.min(dims.isMobile ? 0.62 : 0.74, maxScaleByHeight);

  const cellW = dims.bw * baseScale * (dims.isMobile ? 1.15 : 1.24);
  const cellH = dims.bh * baseScale * (dims.isMobile ? 1.14 : 1.22);

  const row = Math.floor(activeSlot / cols);
  const col = activeSlot % cols;
  const itemsInRow = row === rows - 1 ? activeCount - row * cols : cols;

  const centerY = dims.isMobile ? viewportHeight * 0.64 : viewportHeight * 0.68;
  const startX = viewportWidth * 0.5 - ((itemsInRow - 1) * cellW) / 2;
  const startY = centerY - ((rows - 1) * cellH) / 2;

  const x = startX + col * cellW + (mx - 0.5) * -14;
  const y = startY + row * cellH + (my - 0.5) * -10;

  return {
    x,
    y,
    z: isHovered ? 55 : 0,
    rx: (my - 0.5) * -10,
    ry: (mx - 0.5) * 14,
    rz: 0,
    s: isHovered ? baseScale * 1.08 : baseScale,
    o: 1,
    open: isHovered ? 0.06 : 0,
  };
}

export function computeInactiveTarget(
  viewportWidth: number,
  viewportHeight: number,
  dims: BookDimensions,
  bookIndex: number,
  baseTilt: number,
): BookPose {
  const spread = ((bookIndex / 11) - 0.5) * viewportWidth * 0.7;
  return {
    x: viewportWidth * 0.5 + spread,
    y: viewportHeight + 1.2 * dims.bh,
    z: -120,
    rx: 18,
    ry: baseTilt * 1.5,
    rz: baseTilt * 2.2,
    s: 0.72,
    o: 0,
    open: 0,
  };
}

export function computeFocusBookTarget(
  viewportWidth: number,
  viewportHeight: number,
  dims: BookDimensions,
  isOpen: boolean,
  mx: number,
  my: number,
): BookPose {
  if (dims.isMobile) {
    const s = Math.min(1.05, (0.28 * viewportHeight) / dims.bh);
    const openOffset = isOpen ? Math.max(dims.bw * s * 0.48, 44) : 0;
    return {
      x: viewportWidth * 0.5 + openOffset + (mx - 0.5) * -8,
      y: viewportHeight * 0.31 + (my - 0.5) * -6,
      z: 120,
      rx: (my - 0.5) * -6,
      ry: -10 + (mx - 0.5) * 8,
      rz: 0,
      s,
      o: 1,
      open: isOpen ? 0.92 : 0.08,
    };
  }

  const s = Math.min(1.6, (0.56 * viewportHeight) / dims.bh);
  const x = Math.max(
    dims.bw * s * 1.5 + 30,
    0.53 * viewportWidth - (dims.bw * s) / 2 - 24,
  );
  const y = 0.5 * viewportHeight;

  return {
    x: x + (mx - 0.5) * -10,
    y: y + (my - 0.5) * -8,
    z: 120,
    rx: (my - 0.5) * -8,
    ry: -12 + (mx - 0.5) * 10,
    rz: 0,
    s,
    o: 1,
    open: isOpen ? 0.92 : 0.08,
  };
}

export function computeFocusOutTarget(
  currentX: number,
  currentY: number,
  viewportWidth: number,
  viewportHeight: number,
  baseTilt: number,
): BookPose {
  const cx = viewportWidth * 0.5;
  const cy = viewportHeight * 0.5;
  const angle = Math.atan2(currentY - cy, currentX - cx);
  return {
    x: cx + Math.cos(angle) * viewportWidth * 0.62,
    y: cy + Math.sin(angle) * viewportHeight * 0.62,
    z: -160,
    rx: 0,
    ry: Math.cos(angle) * 24,
    rz: baseTilt * 1.4,
    s: 0.72,
    o: 0,
    open: 0,
  };
}
