import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Book, getBookCoverUrl } from '../lib/books';

interface FocusOverlayProps {
  book: Book | null;
  isSampleOpen: boolean;
  isOnShelf: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSample: () => void;
  onAddToShelf: (book: Book, sourceEl: HTMLElement | null) => void;
  onRemoveFromShelf: (id: string) => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  book,
  isSampleOpen,
  isOnShelf,
  onClose,
  onPrev,
  onNext,
  onToggleSample,
  onAddToShelf,
  onRemoveFromShelf,
}) => {
  useEffect(() => {
    if (!book) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, onClose, onPrev, onNext]);

  if (!book) return null;

  const handleShelfClick = () => {
    if (isOnShelf) {
      onRemoveFromShelf(book.id);
      return;
    }
    const coverEl = document.querySelector<HTMLElement>(
      `[data-book-cover="${book.index}"]`,
    );
    onAddToShelf(book, coverEl);
  };

  return (
    <div
      className="fixed inset-0 z-35 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${book.title} details`}
    >
      {/* Top-left round black close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close book focus view"
        className="pointer-events-auto fixed top-4 left-4 md:top-6 md:left-7 w-10 h-10 rounded-full bg-[#141414] text-[#f4f1ea] inline-flex items-center justify-center shadow-[0_8px_20px_rgba(20,20,20,0.2)] hover:scale-105 transition-transform cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Side panel (left 57% on desktop; bottom sheet on <760px without note) */}
      <aside
        key={book.id}
        className="pointer-events-auto fixed left-5 right-5 bottom-16 md:bottom-auto md:right-8 md:left-[57%] md:top-1/2 md:-translate-y-1/2 max-w-[440px] focus-stagger"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86827a]">
          {book.category} · {book.year}
        </div>

        <h2
          className="mt-2 mb-0 text-[#141414] text-[30px] md:text-[clamp(34px,4vw,62px)] leading-[0.98] tracking-[-0.035em] font-semibold"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          {book.title}
        </h2>

        <p className="mt-2 mb-0 text-[15px] text-[#86827a]">by {book.author}</p>

        <div className="mt-4 md:mt-6 py-3 border-y border-[rgba(20,20,20,0.1)] grid grid-cols-3 gap-3 text-[12px] tabular-nums">
          <div>
            <span className="block text-[#86827a] text-[11px]">Pages</span>
            <span className="font-medium text-[#141414]">{book.pages}</span>
          </div>
          <div>
            <span className="block text-[#86827a] text-[11px]">Edition</span>
            <span className="font-medium text-[#141414]">Hardcover · {book.year}</span>
          </div>
          <div>
            <span className="block text-[#86827a] text-[11px]">Curator score</span>
            <span className="font-medium text-[#141414]">{book.score.toFixed(1)} / 5</span>
          </div>
        </div>

        {/* Note hidden on mobile (<760px) per spec */}
        <p className="hidden md:block mt-5 mb-0 text-[15px] leading-[1.6] text-[#141414]/85">
          {book.note}
        </p>

        <div className="mt-5 md:mt-7 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSample}
            className="h-11 px-5 rounded-full bg-[#141414] text-[#f4f1ea] text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors cursor-pointer whitespace-nowrap"
          >
            {isSampleOpen ? 'Close sample' : 'Read sample'}
          </button>

          <button
            type="button"
            onClick={handleShelfClick}
            className={`h-11 px-5 rounded-full text-[13px] font-medium border transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              isOnShelf
                ? 'bg-[#1f6e43] text-white border-[#1f6e43] hover:bg-[#195a36]'
                : 'bg-transparent text-[#141414] border-[rgba(20,20,20,0.22)] hover:border-[#141414]'
            }`}
          >
            {isOnShelf ? (
              <>
                <span>On your shelf</span>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              <span>Add to shelf</span>
            )}
          </button>
        </div>
      </aside>

      {/* Bottom-center prev / next arrows */}
      <div className="pointer-events-auto fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous book"
          className="w-10 h-10 rounded-full border border-[rgba(20,20,20,0.12)] bg-[#fbfaf6]/90 backdrop-blur-md text-[#141414] inline-flex items-center justify-center hover:border-[#141414] transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next book"
          className="w-10 h-10 rounded-full border border-[rgba(20,20,20,0.12)] bg-[#fbfaf6]/90 backdrop-blur-md text-[#141414] inline-flex items-center justify-center hover:border-[#141414] transition-colors cursor-pointer shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function launchFlyToShelfAnimation(
  book: Book,
  sourceEl: HTMLElement | null,
  targetEl: HTMLElement | null,
) {
  if (!targetEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const srcRect = sourceEl?.getBoundingClientRect() ?? {
    left: window.innerWidth * 0.35,
    top: window.innerHeight * 0.4,
    width: 140,
    height: 186,
  };

  const clone = document.createElement('div');
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = `${srcRect.width}px`;
  clone.style.height = `${srcRect.height}px`;
  clone.style.borderRadius = '4px';
  clone.style.overflow = 'hidden';
  clone.style.backgroundColor = book.coverColor;
  clone.style.boxShadow = '0 14px 32px rgba(20,20,20,0.28)';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '9998';
  clone.style.transformOrigin = 'center center';

  const img = document.createElement('img');
  img.src = getBookCoverUrl(book.id, 300);
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  clone.appendChild(img);
  document.body.appendChild(clone);

  const startX = srcRect.left + srcRect.width * 0.5;
  const startY = srcRect.top + srcRect.height * 0.5;
  const endX = targetRect.left + targetRect.width * 0.5;
  const endY = targetRect.top + targetRect.height * 0.5;
  const ctrlX = (startX + endX) * 0.5 + 80;
  const ctrlY = Math.min(startY, endY) - 140;

  const duration = 900;
  const start = performance.now();

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const inv = 1 - ease;

    const x = inv * inv * startX + 2 * inv * ease * ctrlX + ease * ease * endX;
    const y = inv * inv * startY + 2 * inv * ease * ctrlY + ease * ease * endY;
    const scale = 1 - 0.92 * ease; // scales down to 0.08
    const rot = ease * 38;
    const opacity = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1;

    clone.style.transform = `translate3d(${x - srcRect.width * 0.5}px, ${y - srcRect.height * 0.5}px, 0) rotate(${rot}deg) scale(${scale})`;
    clone.style.opacity = `${opacity}`;

    if (t < 1) {
      window.requestAnimationFrame(step);
    } else {
      clone.remove();
    }
  };

  window.requestAnimationFrame(step);
}
