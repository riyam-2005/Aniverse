"use client";

import { useEffect, useRef, useState } from "react";
import type { CharacterSection } from "./character-config";

interface UseCharacterScrollOptions {
  sections: CharacterSection[];
  cooldownMs?: number;
}

export function useCharacterScroll({
  sections,
  cooldownMs = 800,
}: UseCharacterScrollOptions) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || "hero"
  );
  const [activeMessage, setActiveMessage] = useState<string>(
    sections[0]?.message || ""
  );
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const lastUpdateRef = useRef<number>(0);
  const activeIdRef = useRef<string>(sections[0]?.id || "hero");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionMedia.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    motionMedia.addEventListener("change", handleMotionChange);

    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        // Find visible entries
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        // Pick the entry with highest intersection ratio or nearest center
        visibleEntries.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio
        );
        const target = visibleEntries[0];
        const sectionId = target.target.id;

        if (sectionId && sectionId !== activeIdRef.current) {
          if (now - lastUpdateRef.current > cooldownMs) {
            activeIdRef.current = sectionId;
            lastUpdateRef.current = now;
            setActiveSectionId(sectionId);

            const matched = sections.find((s) => s.id === sectionId);
            if (matched) {
              setActiveMessage(matched.message);
            }
          }
        }
      },
      {
        threshold: [0.15, 0.4, 0.7],
        rootMargin: "-10% 0px -25% 0px",
      }
    );

    // Observe each section in DOM if present
    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    }

    return () => {
      motionMedia.removeEventListener("change", handleMotionChange);
      observer.disconnect();
    };
  }, [sections, cooldownMs]);

  return {
    activeSectionId,
    activeMessage,
    isReducedMotion,
  };
}
