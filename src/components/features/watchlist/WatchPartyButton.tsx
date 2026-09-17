"use client";

import { useState } from "react";
import WatchPartyModal from "@/components/features/watchlist/WatchPartyModal";

interface WatchPartyButtonProps {
  animeMalId: number;
  animeTitle: string;
  totalEpisodes?: number | null;
}

export default function WatchPartyButton({
  animeMalId,
  animeTitle,
  totalEpisodes,
}: WatchPartyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-cyan/50 bg-panel/80 px-4 py-2 text-sm font-bold text-cyan shadow-[0_0_15px_rgba(63,224,208,0.25)] transition-all hover:bg-cyan hover:text-void hover:shadow-[0_0_25px_rgba(63,224,208,0.4)]"
      >
        <span>🎉</span>
        <span>Watch Party</span>
      </button>

      <WatchPartyModal
        animeMalId={animeMalId}
        animeTitle={animeTitle}
        totalEpisodes={totalEpisodes}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
