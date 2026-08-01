"use client";

import { useRef } from "react";

export default function Carousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="group/carousel relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-line bg-void/90 p-2 text-ink opacity-0 backdrop-blur-sm transition-[opacity,transform] active:scale-90 hover:border-cyan/50 hover:text-cyan group-hover/carousel:opacity-100 sm:block"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className="stagger-fade flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-line bg-void/90 p-2 text-ink opacity-0 backdrop-blur-sm transition-[opacity,transform] active:scale-90 hover:border-cyan/50 hover:text-cyan group-hover/carousel:opacity-100 sm:block"
      >
        ›
      </button>
    </div>
  );
}
