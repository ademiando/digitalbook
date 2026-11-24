import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKS,
  CATEGORIES,
  filterBooks,
  getBookCoverUrl,
  getCategoryCounts,
  getHighlightSegments,
  matchesQuery,
} from './books';
import {
  buildRingTable,
  computeFocusBookTarget,
  computeGridTarget,
  computeOrbitTarget,
  createBookSpringState,
  getBookDimensions,
  integrateBookSpring,
  sampleRingAt,
} from './physics';

test('catalog contains all 12 books with valid category counts and cover URLs', () => {
  assert.equal(BOOKS.length, 12);
  const counts = getCategoryCounts(BOOKS);
  assert.deepEqual(counts, {
    Typography: 3,
    Branding: 3,
    Posters: 3,
    Layout: 3,
  });
  for (const cat of CATEGORIES) {
    assert.equal(counts[cat], 3);
  }
  const url = getBookCoverUrl(BOOKS[0].id, 900);
  assert.ok(url.startsWith('https://images.higgs.ai/?default=1&output=webp&url='));
  assert.ok(url.includes('&w=900&q=85'));
});

test('search matching is accent-insensitive across title, author, and category', () => {
  assert.equal(matchesQuery(BOOKS[0], 'grid'), true);
  assert.equal(matchesQuery(BOOKS[0], 'Inés Vahl'), true);
  assert.equal(matchesQuery(BOOKS[8], 'Fossé'), true);
  assert.equal(matchesQuery(BOOKS[5], 'typography'), true);
  assert.equal(filterBooks(BOOKS, '', 'Posters').length, 3);
  assert.equal(filterBooks(BOOKS, 'loud', 'Posters').length, 1);
  assert.equal(filterBooks(BOOKS, 'loud', 'Layout').length, 0);
});

test('highlight segments locate query match cleanly', () => {
  const segs = getHighlightSegments('Rules of Marks', 'marks');
  assert.deepEqual(segs, [
    { text: 'Rules of ', match: false },
    { text: 'Marks', match: true },
  ]);
  const accentSegs = getHighlightSegments('Lena Fosse', 'Fossé');
  assert.deepEqual(accentSegs, [
    { text: 'Lena ', match: false },
    { text: 'Fosse', match: true },
  ]);
});

test('superellipse ring is evenly spaced by arc length', () => {
  const table = buildRingTable(1440, 900, 720);
  assert.ok(table.totalLength > 1000);
  const p0 = sampleRingAt(table, 0);
  const p1 = sampleRingAt(table, 1 / 12);
  const p2 = sampleRingAt(table, 2 / 12);
  const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  // Arc-length parameterization keeps adjacent chord steps close on the smooth perimeter.
  assert.ok(Math.abs(d01 - d12) / d01 < 0.25);
});

test('spring integration converges smoothly to target pose', () => {
  const state = createBookSpringState({
    x: 0,
    y: 0,
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    s: 0.15,
    o: 0,
    open: 0,
  });
  const target = {
    x: 320,
    y: 240,
    z: 70,
    rx: -5,
    ry: 8,
    rz: -12,
    s: 1,
    o: 1,
    open: 0.92,
  };
  for (let frame = 0; frame < 180; frame += 1) {
    integrateBookSpring(state, target, 1 / 60);
  }
  assert.ok(Math.abs(state.p.x - target.x) < 0.5);
  assert.ok(Math.abs(state.p.y - target.y) < 0.5);
  assert.ok(Math.abs(state.p.open - target.open) < 0.01);
});

test('top clearance lifts and shrinks books crossing top center', () => {
  const dims = getBookDimensions(1440);
  const ring = buildRingTable(1440, 900);
  // u = 0.75 is top center (theta = 3*PI/2 => cos=0, sin=-1)
  const pose = computeOrbitTarget({
    ring,
    dims,
    viewportWidth: 1440,
    viewportHeight: 900,
    activeSlot: 0,
    activeCount: 1,
    phase: Math.PI * 1.5,
    time: 0,
    bookIndex: 0,
    seed: 0.5,
    baseTilt: -16,
    mx: 0.5,
    my: 0.5,
    pointerX: -9999,
    pointerY: -9999,
    pointerActive: false,
    isHovered: false,
  });
  const rawTop = sampleRingAt(ring, 0.75);
  assert.ok(pose.y < rawTop.y - 100);
  assert.ok(pose.s < 0.8);
});

test('grid and focus targets compute valid bounds on desktop and mobile', () => {
  const desktopDims = getBookDimensions(1440);
  const desktopGrid0 = computeGridTarget({
    dims: desktopDims,
    viewportWidth: 1440,
    viewportHeight: 900,
    activeSlot: 0,
    activeCount: 12,
    mx: 0.5,
    my: 0.5,
    isHovered: false,
  });
  const desktopGrid6 = computeGridTarget({
    dims: desktopDims,
    viewportWidth: 1440,
    viewportHeight: 900,
    activeSlot: 6,
    activeCount: 12,
    mx: 0.5,
    my: 0.5,
    isHovered: false,
  });
  assert.equal(desktopGrid0.x, desktopGrid6.x);
  assert.ok(desktopGrid6.y > desktopGrid0.y);

  const focusDesktop = computeFocusBookTarget(1440, 900, desktopDims, true, 0.5, 0.5);
  // Open cover extends left by ~1.5 * BW * s; verify >= 30px left margin
  assert.ok(focusDesktop.x >= desktopDims.bw * focusDesktop.s * 1.5 + 29);

  const mobileDims = getBookDimensions(390);
  assert.equal(mobileDims.isMobile, true);
  assert.ok(mobileDims.bw <= 140);
});
