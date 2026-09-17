"use client";

import { useState, useEffect, useRef } from "react";
import {
  subscribeToWatchPartyRoom,
  generateRoomCode,
  type WatchPartyPlayerState,
  type WatchPartyChatMessage,
  type WatchPartyReaction,
  type WatchPartyParticipant,
} from "@/core/clients/realtime";

interface WatchPartyModalProps {
  animeMalId: number;
  animeTitle: string;
  totalEpisodes?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WatchPartyModal({
  animeMalId,
  animeTitle,
  totalEpisodes,
  isOpen,
  onClose,
}: WatchPartyModalProps) {
  const [roomCode] = useState(() => generateRoomCode(animeMalId));
  const [copied, setCopied] = useState(false);
  const [currentUser] = useState(() => {
    const randomId = Math.random().toString(36).substring(2, 9);
    return {
      id: `user-${randomId}`,
      username: `Otaku_${randomId.slice(0, 4)}`,
      isHost: true,
    };
  });

  // Player state
  const [playerState, setPlayerState] = useState<WatchPartyPlayerState>({
    isPlaying: false,
    timestamp: 0,
    episode: 1,
    updatedBy: currentUser.username,
    updatedAt: new Date().toISOString(),
  });

  // Chat and presence state
  const [messages, setMessages] = useState<WatchPartyChatMessage[]>([
    {
      id: "welcome-1",
      userId: "system",
      username: "AniVerse Bot",
      message: `Welcome to the Watch Party for ${animeTitle}! Share the room code to invite friends.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [participants, setParticipants] = useState<WatchPartyParticipant[]>([
    {
      userId: currentUser.id,
      username: currentUser.username,
      isHost: true,
      joinedAt: new Date().toISOString(),
    },
  ]);
  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string }[]>([]);

  const channelRef = useRef<ReturnType<typeof subscribeToWatchPartyRoom> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize Realtime Channel
  useEffect(() => {
    if (!isOpen) return;

    channelRef.current = subscribeToWatchPartyRoom({
      roomCode,
      currentUser,
      onPlayerSync: (state) => {
        setPlayerState(state);
      },
      onChatMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onReaction: (rx) => {
        const id = `${Date.now()}-${Math.random()}`;
        setActiveReactions((prev) => [...prev, { id, emoji: rx.emoji }]);
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((r) => r.id !== id));
        }, 2200);
      },
      onParticipantsChange: (peerList) => {
        if (peerList.length > 0) {
          setParticipants(peerList);
        }
      },
    });

    return () => {
      channelRef.current?.leave();
      channelRef.current = null;
    };
  }, [isOpen, roomCode, currentUser]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format playback timer
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleTogglePlay() {
    const nextState: WatchPartyPlayerState = {
      ...playerState,
      isPlaying: !playerState.isPlaying,
      updatedBy: currentUser.username,
      updatedAt: new Date().toISOString(),
    };
    setPlayerState(nextState);
    channelRef.current?.broadcastPlayerState(nextState);
  }

  function handleSeek(deltaSeconds: number) {
    const nextSeconds = Math.max(0, Math.min(1440, playerState.timestamp + deltaSeconds));
    const nextState: WatchPartyPlayerState = {
      ...playerState,
      timestamp: nextSeconds,
      updatedBy: currentUser.username,
      updatedAt: new Date().toISOString(),
    };
    setPlayerState(nextState);
    channelRef.current?.broadcastPlayerState(nextState);
  }

  function handleEpisodeChange(ep: number) {
    const nextState: WatchPartyPlayerState = {
      ...playerState,
      episode: ep,
      timestamp: 0,
      isPlaying: false,
      updatedBy: currentUser.username,
      updatedAt: new Date().toISOString(),
    };
    setPlayerState(nextState);
    channelRef.current?.broadcastPlayerState(nextState);
  }

  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    const newMsg: WatchPartyChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      userId: currentUser.id,
      username: currentUser.username,
      message: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    channelRef.current?.broadcastChatMessage(newMsg);
    setInputMessage("");
  }

  function handleSendReaction(emoji: string) {
    const rx: WatchPartyReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      userId: currentUser.id,
      username: currentUser.username,
    };
    const localId = rx.id;
    setActiveReactions((prev) => [...prev, { id: localId, emoji }]);
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== localId));
    }, 2200);

    channelRef.current?.broadcastReaction(rx);
  }

  function copyRoomLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/anime/${animeMalId}?room=${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!isOpen) return null;

  const maxEps = totalEpisodes || 12;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="watch-party-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative flex flex-col h-[640px] w-full max-w-4xl overflow-hidden rounded-2xl border border-cyan/40 bg-panel/95 shadow-[0_0_50px_rgba(63,224,208,0.2)]">
        {/* Floating Reactions Canvas */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
          {activeReactions.map((rx) => (
            <span
              key={rx.id}
              className="absolute bottom-16 right-16 text-3xl animate-bounce transition-all duration-1000"
              style={{
                left: `${30 + Math.random() * 40}%`,
              }}
            >
              {rx.emoji}
            </span>
          ))}
        </div>

        {/* Room Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-void/40">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan" />
            </span>
            <div>
              <h2 id="watch-party-title" className="font-display text-lg uppercase tracking-wider text-ink font-bold">
                Watch Party: <span className="text-cyan">{animeTitle}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-ink-dim">
                <span>Room: <strong className="text-ink font-mono">{roomCode}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">{participants.length} live viewer{participants.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-void/50 px-3 py-1.5 text-xs font-mono text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
            >
              {copied ? "✓ Copied!" : "📋 Copy Invite"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close watch party modal"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-dim hover:border-pink hover:text-pink transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Grid: Player Stage & Live Chat */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-[1.4fr_1fr] overflow-hidden">
          {/* Synchronized Player Simulation */}
          <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-line p-6 bg-void/20">
            {/* Virtual Screen */}
            <div className="relative flex flex-col items-center justify-center aspect-video w-full rounded-xl border border-line/60 bg-void shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan/10 via-transparent to-pink/10 pointer-events-none" />
              
              <div className="text-center z-10 p-4">
                <span className="inline-block rounded-full bg-cyan/20 px-3 py-1 text-xs font-mono font-bold text-cyan mb-2">
                  Episode {playerState.episode} Synchronizer
                </span>
                <div className="font-mono text-4xl font-bold tracking-wider text-ink">
                  {formatTime(playerState.timestamp)}
                </div>
                <div className="text-xs text-ink-faint mt-1">
                  Status: {playerState.isPlaying ? "▶ Playing in sync" : "⏸ Paused"} (updated by {playerState.updatedBy})
                </div>
              </div>

              {/* Episode Scrubber Bar */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-line">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-pink transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerState.timestamp / 1440) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sync Controls */}
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-bold text-void transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(63,224,208,0.4)]"
                  >
                    {playerState.isPlaying ? "⏸ Pause Room" : "▶ Play Room"}
                  </button>
                  <button
                    onClick={() => handleSeek(-10)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-mono text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => handleSeek(10)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-mono text-ink-dim hover:border-cyan hover:text-cyan transition-colors"
                  >
                    +10s
                  </button>
                </div>

                {/* Episode Picker */}
                <div className="flex items-center gap-1.5 text-xs text-ink-dim">
                  <span>Ep:</span>
                  <select
                    value={playerState.episode}
                    onChange={(e) => handleEpisodeChange(Number(e.target.value))}
                    className="rounded-md border border-line bg-void px-2 py-1 font-mono text-xs text-ink focus:border-cyan outline-none"
                  >
                    {Array.from({ length: Math.min(24, maxEps) }, (_, i) => i + 1).map((ep) => (
                      <option key={ep} value={ep}>
                        Ep {ep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Participants Rail */}
              <div className="border-t border-line/60 pt-3">
                <div className="text-[11px] font-mono text-ink-dim mb-2 uppercase tracking-wider">
                  Connected Otaku ({participants.length}):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {participants.map((p) => (
                    <span
                      key={p.userId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-void/60 px-2.5 py-1 text-xs text-ink"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {p.username} {p.isHost ? "👑" : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Chat Stream */}
          <div className="flex flex-col justify-between h-full bg-panel/50">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col text-xs ${
                    m.userId === currentUser.id ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-faint mb-0.5">
                    <span className="font-semibold text-ink-dim">{m.username}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 ${
                      m.userId === currentUser.id
                        ? "bg-cyan/20 border border-cyan/40 text-ink font-medium"
                        : m.userId === "system"
                        ? "bg-pink/15 border border-pink/30 text-pink font-mono"
                        : "bg-void border border-line text-ink"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Emoji Reactions & Message Input */}
            <div className="border-t border-line p-3 space-y-2 bg-void/40">
              {/* Reaction Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-ink-faint uppercase">React:</span>
                {["🔥", "💖", "😱", "🍿", "⚡"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="hover:scale-125 transition-transform text-sm p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Chat with watch party..."
                  className="flex-1 rounded-lg border border-line bg-void px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-cyan outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="rounded-lg bg-pink px-4 py-2 text-xs font-bold text-void transition-opacity disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
