import React, { useEffect, useRef, useState } from 'react';
import { BOOKS, Book, getBookCoverUrl } from '../lib/books';
import {
  BookDimensions,
  BookPose,
  BookSpringState,
  RingTable,
  buildRingTable,
  computeFocusBookTarget,
  computeFocusOutTarget,
  computeGridTarget,
  computeInactiveTarget,
  computeOrbitTarget,
  createBookSpringState,
  getBookDimensions,
  integrateBookSpring,
} from '../lib/physics';

interface BookStageProps {
  activeBookIndex: number | null;
  isSampleOpen: boolean;
  layoutMode: 'orbit' | 'grid';
  activeIndices: number[];
  shuffleNonce: number;
  onOpenBook: (index: number) => void;
  onToggleSample: () => void;
  onCloseFocus: () => void;
  onThrowToast: () => void;
}

interface DragState {
  type: 'book' | 'bg';
  bookIndex: number;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  vx: number;
  vy: number;
  moved: boolean;
}

export const BookStage: React.FC<BookStageProps> = ({
  activeBookIndex,
  isSampleOpen,
  layoutMode,
  activeIndices,
  shuffleNonce,
  onOpenBook,
  onToggleSample,
  onCloseFocus,
  onThrowToast,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookElsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const shadowElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Keep dynamic props in refs so the single rAF physics loop never tears down.
  const propsRef = useRef({
    activeBookIndex,
    isSampleOpen,
    layoutMode,
    activeIndices,
    onOpenBook,
    onToggleSample,
    onCloseFocus,
    onThrowToast,
  });
  propsRef.current = {
    activeBookIndex,
    isSampleOpen,
    layoutMode,
    activeIndices,
    onOpenBook,
    onToggleSample,
    onCloseFocus,
    onThrowToast,
  };

  const tiltsRef = useRef<number[]>(BOOKS.map((b) => b.baseTilt));
  const springsRef = useRef<BookSpringState[]>([]);
  const dimsRef = useRef<BookDimensions>(getBookDimensions(1440));
  const ringRef = useRef<RingTable>(buildRingTable(1440, 900));
  const phaseRef = useRef(0.18);
  const phaseVRef = useRef(0);
  const pointerRef = useRef({ x: 720, y: 450, mx: 0.5, my: 0.5, active: false });
  const hoveredIdxRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const prevLayoutRef = useRef<'orbit' | 'grid'>(layoutMode);
  const prevShuffleRef = useRef<number>(shuffleNonce);

  // Kick book velocities on Orbit <-> Grid toggle
  useEffect(() => {
    if (prevLayoutRef.current !== layoutMode) {
      prevLayoutRef.current = layoutMode;
      for (let i = 0; i < springsRef.current.length; i += 1) {
        const s = springsRef.current[i];
        s.v.rz += (Math.random() - 0.5) * 260;
        s.v.z += 160 + Math.random() * 140;
      }
    }
  }, [layoutMode]);

  // Randomize tilts and kick velocities on mini-book shuffle click
  useEffect(() => {
    if (prevShuffleRef.current !== shuffleNonce) {
      prevShuffleRef.current = shuffleNonce;
      tiltsRef.current = BOOKS.map((_, idx) => {
        const sign = idx % 2 === 0 ? -1 : 1;
        return sign * (6 + Math.random() * 16);
      });
      phaseVRef.current += 0.9;
      for (let i = 0; i < springsRef.current.length; i += 1) {
        const s = springsRef.current[i];
        s.v.rz += (Math.random() - 0.5) * 420;
        s.v.rx += (Math.random() - 0.5) * 160;
        s.v.ry += (Math.random() - 0.5) * 200;
        s.v.z += 200 + Math.random() * 120;
      }
    }
  }, [shuffleNonce]);

  useEffect(() => {
    const updateMetrics = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dims = getBookDimensions(w);
      dimsRef.current = dims;
      ringRef.current = buildRingTable(w, h, 720);
      if (stageRef.current) {
        stageRef.current.style.setProperty('--w', `${dims.bw}px`);
        stageRef.current.style.setProperty('--h', `${dims.bh}px`);
        stageRef.current.style.setProperty('--d', `${dims.d}px`);
      }
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);

    const w0 = window.innerWidth;
    const h0 = window.innerHeight;
    pointerRef.current = { x: w0 * 0.5, y: h0 * 0.5, mx: 0.5, my: 0.5, active: false };

    springsRef.current = BOOKS.map(() =>
      createBookSpringState({
        x: w0 * 0.5,
        y: h0 * 0.48,
        z: -80,
        rx: 0,
        ry: 0,
        rz: 0,
        s: 0.15,
        o: 0,
        open: 0,
      }),
    );

    const onWindowPointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.mx = Math.min(1, Math.max(0, e.clientX / w));
      pointerRef.current.my = Math.min(1, Math.max(0, e.clientY / h));
      pointerRef.current.active = e.pointerType !== 'touch';

      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${e.clientX + 14}px, ${e.clientY + 14}px, 0)`;
      }

      const drag = dragRef.current;
      if (!drag) return;

      const now = performance.now();
      const dtMs = Math.max(4, now - drag.lastTime);
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.vx = dx / dtMs;
      drag.vy = dy / dtMs;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastTime = now;

      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= 6) {
        drag.moved = true;
      }

      if (drag.type === 'bg' && propsRef.current.activeBookIndex === null) {
        phaseRef.current += dx * 0.0032;
        phaseVRef.current = (dx / dtMs) * 0.16;
      } else if (drag.type === 'book' && drag.moved) {
        const s = springsRef.current[drag.bookIndex];
        if (s) {
          s.p.x = e.clientX;
          s.p.y = e.clientY;
          s.p.z = 110;
          s.p.s = 1.1;
          s.p.rz = tiltsRef.current[drag.bookIndex] + drag.vx * 22;
          s.p.ry = Math.max(-35, Math.min(35, drag.vx * 30));
          s.p.rx = Math.max(-30, Math.min(30, -drag.vy * 30));
          s.v.x = 0;
          s.v.y = 0;
        }
      }
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;

      if (drag.type === 'book') {
        const el = bookElsRef.current[drag.bookIndex];
        el?.classList.remove('is-dragging');

        if (!drag.moved) {
          if (propsRef.current.activeBookIndex === drag.bookIndex) {
            propsRef.current.onToggleSample();
          } else {
            propsRef.current.onOpenBook(drag.bookIndex);
          }
        } else {
          const s = springsRef.current[drag.bookIndex];
          if (s) {
            // Pointer velocity in px/ms -> px/s scaled by *60 (approx frame-normalized velocity)
            const throwVx = Math.max(-2200, Math.min(2200, drag.vx * 16 * 60));
            const throwVy = Math.max(-2200, Math.min(2200, drag.vy * 16 * 60));
            s.v.x = throwVx;
            s.v.y = throwVy;
            s.v.rz += Math.max(-320, Math.min(320, drag.vx * 240));
          }
          propsRef.current.onThrowToast();
        }
      } else if (drag.type === 'bg' && !drag.moved && propsRef.current.activeBookIndex !== null) {
        propsRef.current.onCloseFocus();
      }
    };

    const onWindowWheel = (e: WheelEvent) => {
      if (propsRef.current.activeBookIndex !== null) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[role="listbox"], .overflow-y-auto')) return;
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      phaseVRef.current += delta * 0.00009;
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    window.addEventListener('wheel', onWindowWheel, { passive: true });

    let rafId = 0;
    const startTime = performance.now();
    let prevTime = startTime;

    const tick = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.033);
      prevTime = now;
      const elapsed = (now - startTime) / 1000;

      const { activeBookIndex: focusIdx, isSampleOpen: sampleOpen, layoutMode: mode, activeIndices: activeList } =
        propsRef.current;

      const dims = dimsRef.current;
      const ring = ringRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ptr = pointerRef.current;

      // Orbit drift & momentum decay (.93 per 60Hz frame)
      if (focusIdx === null && mode === 'orbit') {
        const drag = dragRef.current;
        if (!drag || drag.type !== 'bg') {
          phaseRef.current += 0.035 * dt + phaseVRef.current * dt * 60;
          phaseVRef.current *= Math.pow(0.93, dt * 60);
        }
      }

      const activeSlotMap = new Map<number, number>();
      for (let k = 0; k < activeList.length; k += 1) {
        activeSlotMap.set(activeList[k], k);
      }

      const depthOrder: Array<{ idx: number; depthScore: number }> = [];

      for (let i = 0; i < BOOKS.length; i += 1) {
        const book = BOOKS[i];
        const state = springsRef.current[i];
        const bookEl = bookElsRef.current[i];
        const shadowEl = shadowElsRef.current[i];
        if (!state || !bookEl || !shadowEl) continue;

        const isDragged = dragRef.current?.type === 'book' && dragRef.current.bookIndex === i && dragRef.current.moved;
        const releaseAt = 0.25 + i * 0.07;

        let target: BookPose;

        if (elapsed < releaseAt && focusIdx === null) {
          target = {
            x: w * 0.5,
            y: h * 0.48,
            z: -80,
            rx: 0,
            ry: 0,
            rz: tiltsRef.current[i],
            s: 0.15,
            o: 0,
            open: 0,
          };
        } else if (focusIdx !== null) {
          if (i === focusIdx) {
            target = computeFocusBookTarget(w, h, dims, sampleOpen, ptr.mx, ptr.my);
          } else {
            target = computeFocusOutTarget(
              state.p.x,
              state.p.y,
              w,
              h,
              tiltsRef.current[i],
            );
          }
        } else {
          const slot = activeSlotMap.get(i);
          if (slot === undefined) {
            target = computeInactiveTarget(w, h, dims, i, tiltsRef.current[i]);
          } else if (mode === 'grid') {
            target = computeGridTarget({
              dims,
              viewportWidth: w,
              viewportHeight: h,
              activeSlot: slot,
              activeCount: activeList.length,
              mx: ptr.mx,
              my: ptr.my,
              isHovered: hoveredIdxRef.current === i && !isDragged,
            });
          } else {
            target = computeOrbitTarget({
              ring,
              dims,
              viewportWidth: w,
              viewportHeight: h,
              activeSlot: slot,
              activeCount: activeList.length,
              phase: phaseRef.current,
              time: elapsed,
              bookIndex: i,
              seed: book.seed,
              baseTilt: tiltsRef.current[i],
              mx: ptr.mx,
              my: ptr.my,
              pointerX: ptr.x,
              pointerY: ptr.y,
              pointerActive: ptr.active,
              isHovered: hoveredIdxRef.current === i && !isDragged,
            });
          }
        }

        if (!isDragged) {
          integrateBookSpring(state, target, dt);
        }

        const p = state.p;
        const tx = p.x - dims.bw * 0.5;
        const ty = p.y - dims.bh * 0.5;

        const clampedO = Math.max(0, Math.min(1, p.o));
        bookEl.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${p.z.toFixed(2)}px) rotateZ(${p.rz.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
        bookEl.style.opacity = clampedO >= 0.995 ? '1' : clampedO.toFixed(3);
        bookEl.style.setProperty('--open', `${Math.max(0, Math.min(1, p.open)).toFixed(4)}`);
        bookEl.style.setProperty('--gx', `${(p.ry * 2.2).toFixed(1)}px`);
        bookEl.style.pointerEvents = clampedO > 0.15 ? 'auto' : 'none';

        const lift = Math.max(0, p.z);
        const sx = tx + 10 + lift * 0.22;
        const sy = ty + 16 + lift * 0.28;
        const sScale = p.s * (1 + lift * 0.0012);
        const sOpacity = Math.max(0, Math.min(1, p.o)) * Math.max(0.18, 0.85 - lift * 0.003);

        shadowEl.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, -10px) rotateZ(${p.rz.toFixed(2)}deg) scale(${sScale.toFixed(4)})`;
        shadowEl.style.opacity = `${sOpacity.toFixed(3)}`;

        depthOrder.push({
          idx: i,
          depthScore: isDragged ? 9999 : p.z * 100 + (i === focusIdx ? 5000 : 0) + p.y * 0.01,
        });
      }

      depthOrder.sort((a, b) => a.depthScore - b.depthScore);
      for (let rank = 0; rank < depthOrder.length; rank += 1) {
        const idx = depthOrder[rank].idx;
        const bookEl = bookElsRef.current[idx];
        const shadowEl = shadowElsRef.current[idx];
        const zBase = (rank + 1) * 2;
        if (shadowEl) shadowEl.style.zIndex = `${zBase - 1}`;
        if (bookEl) bookEl.style.zIndex = `${zBase}`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
      window.removeEventListener('wheel', onWindowWheel);
    };
  }, []);

  const handleBookPointerDown = (bookIndex: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    const el = bookElsRef.current[bookIndex];
    el?.classList.add('is-dragging');
    try {
      el?.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active pointerId
    }
    dragRef.current = {
      type: 'book',
      bookIndex,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
      vx: 0,
      vy: 0,
      moved: false,
    };
  };

  const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragRef.current = {
      type: 'bg',
      bookIndex: -1,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
      vx: 0,
      vy: 0,
      moved: false,
    };
  };

  return (
    <>
      {/* Empty-space backdrop for drag-to-spin and click-to-close focus */}
      <div id="stage-bg" onPointerDown={handleBgPointerDown} aria-hidden="true" />

      <div id="stage" ref={stageRef} data-testid="book-stage">
        {BOOKS.map((book, idx) => (
          <React.Fragment key={book.id}>
            <div
              ref={(el) => {
                shadowElsRef.current[idx] = el;
              }}
              className="book-shadow"
              aria-hidden="true"
            />
            <button
              ref={(el) => {
                bookElsRef.current[idx] = el;
              }}
              type="button"
              data-book-index={idx}
              aria-label={`${book.title} by ${book.author}`}
              onPointerDown={(e) => handleBookPointerDown(idx, e)}
              onPointerEnter={() => {
                hoveredIdxRef.current = idx;
                if (activeBookIndex === null) {
                  setHoveredBook(book);
                }
              }}
              onPointerLeave={() => {
                if (hoveredIdxRef.current === idx) {
                  hoveredIdxRef.current = null;
                }
                setHoveredBook((prev) => (prev?.index === idx ? null : prev));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (activeBookIndex === idx) {
                    onToggleSample();
                  } else {
                    onOpenBook(idx);
                  }
                }
              }}
              className="book"
            >
              <span className="b3d">
                {/* Front hinged cover + inner endpaper */}
                <span className="face front">
                  <span
                    className="cv"
                    style={{ backgroundColor: book.coverColor }}
                    data-book-cover={idx}
                  >
                    {!failedImages[book.id] ? (
                      <img
                        src={getBookCoverUrl(book.id, 900)}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [book.id]: true }))
                        }
                      />
                    ) : (
                      <span className="flex flex-col justify-between h-full p-4 text-[#141414]">
                        <span className="text-[10px] uppercase tracking-widest opacity-70">
                          {book.category}
                        </span>
                        <span className="font-semibold text-base leading-tight">
                          {book.title}
                        </span>
                        <span className="text-[11px] opacity-75">{book.author}</span>
                      </span>
                    )}
                  </span>
                  <span
                    className="inside"
                    style={{ backgroundColor: book.endpaperColor }}
                  />
                </span>

                {/* First readable page */}
                <span className="face page1">
                  <span>
                    <span className="block page1-kicker">
                      {book.category} · {book.year}
                    </span>
                    <span className="block page1-title">{book.title}</span>
                    <span className="block page1-note">{book.note}</span>
                  </span>
                  <span className="page1-foot">
                    <span>{book.author}</span>
                    <span>p. 01</span>
                  </span>
                </span>

                {/* Back cover */}
                <span
                  className="face back"
                  style={{ backgroundColor: book.spineColor }}
                />

                {/* Spine */}
                <span
                  className="spine"
                  style={{ backgroundColor: book.spineColor }}
                />

                {/* Page block edges */}
                <span className="fore-edge" />
                <span className="top-edge" />
                <span className="bottom-edge" />
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Cursor-following black pill tooltip */}
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className={`fixed left-0 top-0 z-50 pointer-events-none px-3 py-1.5 rounded-full bg-[#141414] text-[#f4f1ea] shadow-[0_8px_20px_rgba(20,20,20,0.22)] text-[12px] whitespace-nowrap transition-opacity duration-150 ${
          hoveredBook && activeBookIndex === null ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hoveredBook ? (
          <>
            <span className="font-medium">{hoveredBook.title}</span>
            <span className="text-[#f4f1ea]/60 mx-1.5">·</span>
            <span className="text-[#f4f1ea]/80">{hoveredBook.author}</span>
          </>
        ) : null}
      </div>
    </>
  );
};
