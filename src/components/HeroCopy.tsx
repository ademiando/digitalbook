import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BOOKS, CATEGORIES, Category, getBookCoverUrl, getCategoryCounts } from '../lib/books';

interface HeroCopyProps {
  layoutMode: 'orbit' | 'grid';
  onToggleLayout: () => void;
  activeCategory: Category | null;
  onToggleCategory: (category: Category) => void;
  onShuffleRing: () => void;
}

const CATEGORY_COUNTS = getCategoryCounts(BOOKS);

export const HeroCopy: React.FC<HeroCopyProps> = ({
  layoutMode,
  onToggleLayout,
  activeCategory,
  onToggleCategory,
  onShuffleRing,
}) => {
  const [flipCount, setFlipCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFlipCount((c) => c + 1);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  // Front face shows even flips, back face shows odd flips so every 2.6s rotateY reveals a fresh cover smoothly.
  const frontBook = BOOKS[Math.floor((flipCount + 1) / 2) * 2 % BOOKS.length];
  const backBook = BOOKS[(Math.floor(flipCount / 2) * 2 + 1) % BOOKS.length];

  return (
    <section className="hero-copy" aria-label="Folio Room overview">
      <div className="hero-copy-inner max-w-[272px] md:max-w-[780px]">
        <h1 className="headline-text m-0">
          <span className="line-mask">
            <span className="line-rise">One Shelf for</span>
          </span>
          <span className="line-mask">
            <span className="line-rise line-rise-2">
              Every
              <button
                type="button"
                onClick={onShuffleRing}
                aria-label="Shuffle book orbit"
                title="Shuffle shelf"
                className="mini-book-btn pointer-events-auto"
              >
                <span
                  className="mini-book-3d"
                  style={{ transform: `rotateY(${flipCount * 180}deg)` }}
                >
                  <span
                    className="mini-book-face"
                    style={{ backgroundColor: frontBook.coverColor }}
                  >
                    <img
                      src={getBookCoverUrl(frontBook.id, 160)}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <span
                    className="mini-book-face mini-book-face-back"
                    style={{ backgroundColor: backBook.coverColor }}
                  >
                    <img
                      src={getBookCoverUrl(backBook.id, 160)}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </span>
                </span>
              </button>
              Curious Mind.
            </span>
          </span>
        </h1>

        <p className="mt-3 md:mt-5 mb-0 text-[13.5px] md:text-[17px] leading-[1.45] md:leading-[1.5] text-[#86827a] font-normal max-w-[240px] md:max-w-[440px]">
          A digital library of design books for curious creatives.
        </p>

        <div className="mt-5 md:mt-7 flex flex-col items-center gap-3 md:gap-3.5 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleLayout}
            className="cta-pill inline-flex items-center gap-2.5 px-5 md:px-6 rounded-full bg-[#141414] text-[#f4f1ea] text-[13px] md:text-[13.5px] font-medium cursor-pointer shadow-[0_8px_24px_rgba(20,20,20,0.16)] whitespace-nowrap"
          >
            <span>{layoutMode === 'grid' ? 'Back to Orbit' : 'View Collections'}</span>
            <ArrowRight className="cta-arrow w-4 h-4" aria-hidden="true" />
          </button>

          <div
            className="flex flex-wrap items-center justify-center gap-1.5 max-w-[252px] md:max-w-none"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onToggleCategory(category)}
                  className={`inline-flex items-center gap-1.5 h-7 md:h-8 px-2.5 md:px-3 rounded-full text-[11px] md:text-[12px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#141414] text-[#f4f1ea] border-[#141414]'
                      : 'bg-[#fbfaf6]/75 text-[#141414] border-[rgba(20,20,20,0.1)] hover:border-[rgba(20,20,20,0.28)]'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`tabular-nums text-[10.5px] md:text-[11px] ${
                      isActive ? 'text-[#f4f1ea]/70' : 'text-[#86827a]'
                    }`}
                  >
                    {CATEGORY_COUNTS[category]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
