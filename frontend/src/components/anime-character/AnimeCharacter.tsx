"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { DEFAULT_MASCOT_CONFIG, type MascotConfig } from "./character-config";
import CharacterSpeech from "./CharacterSpeech";
import { useCharacterScroll } from "./useCharacterScroll";
import Mascot3DCanvas from "./Mascot3DCanvas";

export interface AnimeCharacterProps {
  src?: string;
  alt?: string;
  name?: string;
  config?: MascotConfig;
  className?: string;
}

export default function AnimeCharacter({
  src,
  alt,
  name,
  config = DEFAULT_MASCOT_CONFIG,
  className = "",
}: AnimeCharacterProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [speechDismissed, setSpeechDismissed] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  const characterSrc = src || config.assetPath;
  const characterAlt = alt || config.alt;
  const characterName = name || config.name;

  const { activeMessage, isReducedMotion } = useCharacterScroll({
    sections: config.sections,
  });

  // Global page scroll progress
  const { scrollYProgress } = useScroll();

  // Smooth spring physics for continuous travel
  const smoothProgress = useSpring(scrollYProgress, config.spring);

  // Map scroll progress to vertical travel (viewport percentage + pixel offset)
  // At scroll 0%, character starts near top right (top 15vh).
  // At scroll 100%, character smoothly travels to bottom (top 75vh).
  const characterY = useTransform(smoothProgress, [0, 1], [0, 480]);
  const characterScale = useTransform(smoothProgress, [0, 0.8, 1], [1, 1, 0.94]);
  const characterRotation = useTransform(smoothProgress, [0, 0.5, 1], [0, -1.2, 1.2]);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    try {
      const saved = localStorage.getItem("aniverse_mascot_view");
      if (saved === "3d" || saved === "2d") {
        setViewMode(saved);
      }
    } catch {
      // ignore
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function toggleViewMode() {
    const next = viewMode === "2d" ? "3d" : "2d";
    setViewMode(next);
    try {
      localStorage.setItem("aniverse_mascot_view", next);
    } catch {
      // ignore
    }
  }

  // When active section message changes, reset manual override and dismissed state
  useEffect(() => {
    setSpeechDismissed(false);
    setManualMessage(null);
  }, [activeMessage]);

  function handleMascotClick() {
    const greetings = [
      "Let's find your next favorite anime! ✨",
      "I'm Ani, your AniVerse companion! 💖",
      "Did you check your Anime DNA profile today? 🧬",
      "Scroll down to see what's trending! 🔥",
    ];
    const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
    setManualMessage(randomGreet);
    setSpeechDismissed(false);
  }

  if (!mounted) return null;

  const displayedMessage = manualMessage || activeMessage;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed z-30 select-none ${className}`}
      style={{
        right: isMobile ? "12px" : "clamp(16px, 3.5vw, 56px)",
        top: isMobile ? "auto" : "18vh",
        bottom: isMobile ? "24px" : "auto",
      }}
    >
      {/* Reduced Motion Fallback: Static position without parallax */}
      {isReducedMotion ? (
        <div className="flex flex-col items-end gap-2">
          {!speechDismissed && displayedMessage && (
            <CharacterSpeech
              message={displayedMessage}
              name={characterName}
              onDismiss={() => setSpeechDismissed(true)}
              className="mb-2"
            />
          )}
          <div
            onClick={handleMascotClick}
            className="pointer-events-auto cursor-pointer relative h-36 w-28 sm:h-56 sm:w-44 transition-opacity hover:opacity-90"
          >
            <Image
              src={characterSrc}
              alt={characterAlt}
              fill
              sizes="(max-width: 768px) 120px, 240px"
              priority
              className="object-contain drop-shadow-[0_0_25px_rgba(63,224,208,0.3)]"
            />
          </div>
        </div>
      ) : (
        /* Dynamic Scroll-Linked Animated Character */
        <motion.div
          style={isMobile ? undefined : { y: characterY, scale: characterScale, rotate: characterRotation }}
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-end"
        >
          {/* Floating Speech Bubble */}
          <div className="relative mb-2">
            {!speechDismissed && displayedMessage && (
              <CharacterSpeech
                message={displayedMessage}
                name={characterName}
                onDismiss={() => setSpeechDismissed(true)}
                className="shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              />
            )}
          </div>

          {/* Desktop & Tablet Silhouette Character */}
          {!isMobile ? (
            <div className="flex flex-col items-end">
              {viewMode === "3d" ? (
                <div className="pointer-events-auto flex flex-col items-end">
                  <Mascot3DCanvas
                    src={characterSrc}
                    alt={characterAlt}
                    onClick={handleMascotClick}
                  />
                  <button
                    type="button"
                    onClick={toggleViewMode}
                    className="mt-1 rounded-full border border-line bg-panel/90 px-2 py-0.5 font-mono text-[9px] text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
                  >
                    Switch to Classic 2D
                  </button>
                </div>
              ) : (
                <div className="pointer-events-auto flex flex-col items-end">
                  <motion.div
                    animate={{
                      y: [-4, 4, -4],
                      rotate: [-1, 1, -1],
                    }}
                    transition={{
                      duration: config.floating.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    onClick={handleMascotClick}
                    className="group relative h-[260px] w-[190px] lg:h-[330px] lg:w-[240px] xl:h-[380px] xl:w-[270px] cursor-pointer transition-transform"
                  >
                    {/* Soft Cyberpunk Glow Aura */}
                    <div className="absolute -inset-3 rounded-full bg-gradient-to-t from-cyan/20 via-pink/20 to-transparent blur-xl opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Character Image */}
                    <Image
                      src={characterSrc}
                      alt={characterAlt}
                      fill
                      sizes="(max-width: 1024px) 200px, 300px"
                      priority
                      className="object-contain drop-shadow-[0_0_20px_rgba(63,224,208,0.35)] transition-all duration-300 group-hover:scale-105"
                    />

                    {/* Subtle Interactive Hint Badge */}
                    <div className="absolute -bottom-1 right-2 rounded-full border border-line/80 bg-panel/90 px-2 py-0.5 font-mono text-[9px] font-semibold text-ink-dim opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                      ✨ Click me!
                    </div>
                  </motion.div>
                  <button
                    type="button"
                    onClick={toggleViewMode}
                    className="mt-1 rounded-full border border-line bg-panel/90 px-2 py-0.5 font-mono text-[9px] text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
                  >
                    🔮 3D Hologram Mode
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Mobile Compact Mini-Mascot Badge */
            <motion.button
              type="button"
              onClick={handleMascotClick}
              whileTap={{ scale: 0.92 }}
              aria-label="Anime Companion Mascot"
              className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan/60 bg-panel shadow-2xl backdrop-blur-md"
            >
              <div className="absolute -inset-1 rounded-full bg-cyan/20 blur-sm animate-pulse" />
              <div className="relative h-11 w-11 overflow-hidden rounded-full">
                <Image
                  src={characterSrc}
                  alt={characterAlt}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink font-mono text-[9px] font-black text-void shadow">
                ✨
              </span>
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
