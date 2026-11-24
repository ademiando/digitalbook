import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOOKS, Book, Category, THROW_TOASTS, filterBooks } from './lib/books';
import { TopBar } from './components/TopBar';
import { HeroCopy } from './components/HeroCopy';
import { BookStage } from './components/BookStage';
import { FocusOverlay, launchFlyToShelfAnimation } from './components/FocusOverlay';

const SHELF_STORAGE_KEY = 'folio-room-shelf';

function loadInitialShelf(): string[] {
  try {
    const raw = window.localStorage.getItem(SHELF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    // Ignore storage access errors
  }
  return [];
}

export default function App() {
  const [layoutMode, setLayoutMode] = useState<'orbit' | 'grid'>('orbit');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookIndex, setActiveBookIndex] = useState<number | null>(null);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [shelfIds, setShelfIds] = useState<string[]>(loadInitialShelf);
  const [shelfBumpKey, setShelfBumpKey] = useState(0);
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const shelfBadgeRef = useRef<HTMLSpanElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const throwCounterRef = useRef(0);

  const showToast = useCallback((text: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ id, text });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 2200);
  }, []);

  // Persist My Shelf locally
  useEffect(() => {
    try {
      window.localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(shelfIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [shelfIds]);

  // Sync body classes for CSS state transitions
  useEffect(() => {
    document.body.classList.toggle('focus', activeBookIndex !== null);
    document.body.classList.toggle('grid-mode', layoutMode === 'grid');
    document.body.dataset.state =
      activeBookIndex !== null ? 'focus' : layoutMode;
  }, [activeBookIndex, layoutMode]);

  const activeBooks = useMemo(
    () => filterBooks(BOOKS, searchQuery, activeCategory),
    [searchQuery, activeCategory],
  );

  const activeIndices = useMemo(
    () => activeBooks.map((b) => b.index),
    [activeBooks],
  );

  const openBook = useCallback((index: number) => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
    }
    setActiveBookIndex(index);
    setIsSampleOpen(false);
    openTimerRef.current = window.setTimeout(() => {
      setIsSampleOpen(true);
    }, 650);
  }, []);

  const closeFocus = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setIsSampleOpen(false);
    setActiveBookIndex(null);
  }, []);

  const navigateFocus = useCallback(
    (delta: -1 | 1) => {
      if (activeBookIndex === null) return;
      const list = activeIndices.length > 0 ? activeIndices : BOOKS.map((b) => b.index);
      const pos = list.indexOf(activeBookIndex);
      const nextPos = pos === -1 ? 0 : (pos + delta + list.length) % list.length;
      openBook(list[nextPos]);
    },
    [activeBookIndex, activeIndices, openBook],
  );

  const handleToggleSample = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setIsSampleOpen((prev) => !prev);
  }, []);

  const handleAddToShelf = useCallback(
    (book: Book, sourceEl: HTMLElement | null) => {
      setShelfIds((prev) => (prev.includes(book.id) ? prev : [...prev, book.id]));
      launchFlyToShelfAnimation(book, sourceEl, shelfBadgeRef.current);
      window.setTimeout(() => {
        setShelfBumpKey((k) => k + 1);
      }, 780);
      showToast(`Added “${book.title}” to your shelf`);
    },
    [showToast],
  );

  const handleRemoveFromShelf = useCallback(
    (id: string) => {
      const removed = BOOKS.find((b) => b.id === id);
      setShelfIds((prev) => prev.filter((item) => item !== id));
      if (removed) {
        showToast(`Removed “${removed.title}”`);
      }
    },
    [showToast],
  );

  const handleToggleCategory = useCallback((cat: Category) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const handleShuffleRing = useCallback(() => {
    setShuffleNonce((n) => n + 1);
    showToast('Shelf shuffled');
  }, [showToast]);

  const handleThrowToast = useCallback(() => {
    const msg = THROW_TOASTS[throwCounterRef.current % THROW_TOASTS.length];
    throwCounterRef.current += 1;
    showToast(msg);
  }, [showToast]);

  const handleResetHome = useCallback(() => {
    closeFocus();
    setLayoutMode('orbit');
    setActiveCategory(null);
    setSearchQuery('');
  }, [closeFocus]);

  const focusedBook = activeBookIndex !== null ? BOOKS[activeBookIndex] ?? null : null;

  return (
    <main className="relative h-full w-full overflow-hidden select-none">
      <BookStage
        activeBookIndex={activeBookIndex}
        isSampleOpen={isSampleOpen}
        layoutMode={layoutMode}
        activeIndices={activeIndices}
        shuffleNonce={shuffleNonce}
        onOpenBook={openBook}
        onToggleSample={handleToggleSample}
        onCloseFocus={closeFocus}
        onThrowToast={handleThrowToast}
      />

      <TopBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        shelfIds={shelfIds}
        onOpenBook={openBook}
        onRemoveFromShelf={handleRemoveFromShelf}
        shelfBadgeRef={shelfBadgeRef}
        shelfBumpKey={shelfBumpKey}
        onResetHome={handleResetHome}
      />

      <HeroCopy
        layoutMode={layoutMode}
        onToggleLayout={() =>
          setLayoutMode((m) => (m === 'orbit' ? 'grid' : 'orbit'))
        }
        activeCategory={activeCategory}
        onToggleCategory={handleToggleCategory}
        onShuffleRing={handleShuffleRing}
      />

      <FocusOverlay
        book={focusedBook}
        isSampleOpen={isSampleOpen}
        isOnShelf={focusedBook ? shelfIds.includes(focusedBook.id) : false}
        onClose={closeFocus}
        onPrev={() => navigateFocus(-1)}
        onNext={() => navigateFocus(1)}
        onToggleSample={handleToggleSample}
        onAddToShelf={handleAddToShelf}
        onRemoveFromShelf={handleRemoveFromShelf}
      />

      {/* Bottom Corners: Hints (desktop only) & Orbit/Grid Switch */}
      <div className="corners-bottom fixed inset-x-0 bottom-0 z-30 pointer-events-none px-4 pb-4 md:px-7 md:pb-6 flex items-center justify-center md:justify-between transition-opacity duration-300">
        <div className="hidden md:block text-[12px] text-[#86827a] tracking-[-0.01em] pointer-events-auto">
          Drag to throw · Scroll to spin · Click to open
        </div>

        <div
          role="group"
          aria-label="Layout mode"
          className="pointer-events-auto inline-flex items-center p-1 rounded-full border border-[rgba(20,20,20,0.1)] bg-[#fbfaf6]/85 backdrop-blur-md shadow-[0_2px_12px_rgba(20,20,20,0.05)]"
        >
          <button
            type="button"
            aria-pressed={layoutMode === 'orbit'}
            onClick={() => setLayoutMode('orbit')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              layoutMode === 'orbit'
                ? 'bg-[#141414] text-[#f4f1ea]'
                : 'text-[#86827a] hover:text-[#141414]'
            }`}
          >
            Orbit
          </button>
          <button
            type="button"
            aria-pressed={layoutMode === 'grid'}
            onClick={() => setLayoutMode('grid')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              layoutMode === 'grid'
                ? 'bg-[#141414] text-[#f4f1ea]'
                : 'text-[#86827a] hover:text-[#141414]'
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Centered Toast Pill */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 bottom-16 md:bottom-7 z-50 pointer-events-none px-4 py-2 rounded-full bg-[#141414] text-[#f4f1ea] text-[12.5px] font-medium shadow-[0_10px_28px_rgba(20,20,20,0.22)] transition-all duration-300 whitespace-nowrap ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {toast?.text ?? ''}
      </div>
    </main>
  );
}
