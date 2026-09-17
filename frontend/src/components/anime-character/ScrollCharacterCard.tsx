"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useCharacterScroll } from "./useCharacterScroll";
import { DEFAULT_MASCOT_CONFIG } from "./character-config";

export default function ScrollCharacterCard() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [manualDialogue, setManualDialogue] = useState<string | null>(null);

  const { activeMessage, isReducedMotion } = useCharacterScroll({
    sections: DEFAULT_MASCOT_CONFIG.sections,
  });

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const translateY = useTransform(smoothProgress, [0, 1], [0, 520]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDismissed(false);
    setManualDialogue(null);
  }, [activeMessage]);

  const displayedMessage = manualDialogue || activeMessage;

  const handleMascotClick = () => {
    const lines = [
      "Let's find your next favorite anime! ✨",
      "I'm Ani, your AniVerse companion! 💖",
      "Did you check your Anime DNA profile? 🧬",
      "Scroll down to see what's airing today! 📺",
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    setManualDialogue(pick);
    setDismissed(false);
  };

  if (!mounted) return null;

  return (
    <motion.div
      style={isReducedMotion ? undefined : { y: translateY }}
      className="fixed right-4 top-40 z-30 hidden sm:flex flex-col items-end pointer-events-none select-none"
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {!dismissed && displayedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="pointer-events-auto mb-2 max-w-[210px] rounded-2xl border border-pink/30 bg-[#120F24]/95 p-3 text-xs text-ink shadow-xl shadow-black/60 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-pink text-[11px]">Ani</span>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-[10px] text-ink-faint hover:text-ink"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">
              {displayedMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mascot Card */}
      <div
        onClick={handleMascotClick}
        className="pointer-events-auto group flex cursor-pointer flex-col items-center rounded-2xl border border-pink/30 bg-[#141226]/90 p-2 shadow-2xl shadow-black/80 backdrop-blur-md transition-all hover:border-pink hover:shadow-pink-glow hover:scale-105"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-pink/40 bg-[#0F0D1C]">
          <Image
            src="/images/aniverse-mascot-avatar.png"
            alt="Ani Mascot"
            fill
            sizes="56px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="mt-1.5 flex flex-col items-center">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-pink">
            Scroll for more
          </span>
          <span className="text-xs text-pink animate-bounce">↓</span>
        </div>
      </div>
    </motion.div>
  );
}
