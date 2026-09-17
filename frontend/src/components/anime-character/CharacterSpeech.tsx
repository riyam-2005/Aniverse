"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CharacterSpeechProps {
  message: string;
  name?: string;
  autoHideDuration?: number;
  onDismiss?: () => void;
  className?: string;
}

export default function CharacterSpeech({
  message,
  name = "Ani",
  autoHideDuration = 7000,
  onDismiss,
  className = "",
}: CharacterSpeechProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [message, autoHideDuration, onDismiss]);

  if (!message) return null;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.92 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          aria-hidden="true"
          className={`relative max-w-[260px] sm:max-w-[280px] rounded-2xl border border-cyan/40 bg-panel/90 p-3.5 shadow-2xl backdrop-blur-md transition-all ${className}`}
        >
          {/* Header pill */}
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan border border-cyan/30">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-ping" />
              {name}
            </span>
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                onDismiss?.();
              }}
              title="Close dialogue"
              className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-panel2 hover:text-ink"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Dialogue body */}
          <p className="text-xs font-medium leading-relaxed text-ink selection:bg-cyan/30">
            {message}
          </p>

          {/* Speech bubble pointer tail */}
          <div
            className="absolute -bottom-2 right-8 h-3 w-3 rotate-45 border-b border-r border-cyan/40 bg-panel/90"
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
