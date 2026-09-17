import { createClient } from "@/core/clients/supabase";

export interface WatchPartyPlayerState {
  isPlaying: boolean;
  timestamp: number; // in seconds
  episode: number;
  updatedBy: string;
  updatedAt: string;
}

export interface WatchPartyChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
  badge?: string;
}

export interface WatchPartyReaction {
  id: string;
  emoji: string;
  userId: string;
  username: string;
}

export interface WatchPartyParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  isHost?: boolean;
  joinedAt: string;
}

/**
 * Generates a human-friendly alphanumeric room code for watch party sharing.
 */
export function generateRoomCode(animeMalId: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ANI-${animeMalId}-${randomPart}`;
}

/**
 * Creates and registers a Supabase Realtime Channel for a watch party room.
 */
export function subscribeToWatchPartyRoom({
  roomCode,
  currentUser,
  onPlayerSync,
  onChatMessage,
  onReaction,
  onParticipantsChange,
}: {
  roomCode: string;
  currentUser: { id: string; username: string; avatarUrl?: string; isHost?: boolean };
  onPlayerSync: (state: WatchPartyPlayerState) => void;
  onChatMessage: (message: WatchPartyChatMessage) => void;
  onReaction: (reaction: WatchPartyReaction) => void;
  onParticipantsChange: (participants: WatchPartyParticipant[]) => void;
}) {
  const supabase = createClient();
  const channelName = `watch-party:${roomCode}`;
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: currentUser.id },
    },
  });

  // Listen to broadcast player sync
  channel.on("broadcast", { event: "player_sync" }, ({ payload }) => {
    if (payload) onPlayerSync(payload as WatchPartyPlayerState);
  });

  // Listen to live chat messages
  channel.on("broadcast", { event: "chat_message" }, ({ payload }) => {
    if (payload) onChatMessage(payload as WatchPartyChatMessage);
  });

  // Listen to floating emoji reactions
  channel.on("broadcast", { event: "reaction" }, ({ payload }) => {
    if (payload) onReaction(payload as WatchPartyReaction);
  });

  // Presence tracking for connected viewers
  channel.on("presence", { event: "sync" }, () => {
    const presenceState = channel.presenceState();
    const participants: WatchPartyParticipant[] = [];

    for (const key of Object.keys(presenceState)) {
      const presences = presenceState[key] as any[];
      if (presences && presences.length > 0) {
        const item = presences[0];
        participants.push({
          userId: item.userId || key,
          username: item.username || "Otaku Peer",
          avatarUrl: item.avatarUrl,
          isHost: !!item.isHost,
          joinedAt: item.joinedAt || new Date().toISOString(),
        });
      }
    }

    onParticipantsChange(participants);
  });

  // Subscribe and track presence
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      try {
        await channel.track({
          userId: currentUser.id,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          isHost: currentUser.isHost ?? false,
          joinedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("[realtime] presence tracking error:", err);
      }
    }
  });

  return {
    broadcastPlayerState: async (state: WatchPartyPlayerState) => {
      try {
        await channel.send({
          type: "broadcast",
          event: "player_sync",
          payload: state,
        });
      } catch (err) {
        console.error("[realtime] broadcast player_sync failed:", err);
      }
    },
    broadcastChatMessage: async (message: WatchPartyChatMessage) => {
      try {
        await channel.send({
          type: "broadcast",
          event: "chat_message",
          payload: message,
        });
      } catch (err) {
        console.error("[realtime] broadcast chat_message failed:", err);
      }
    },
    broadcastReaction: async (reaction: WatchPartyReaction) => {
      try {
        await channel.send({
          type: "broadcast",
          event: "reaction",
          payload: reaction,
        });
      } catch (err) {
        console.error("[realtime] broadcast reaction failed:", err);
      }
    },
    leave: () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn("[realtime] error removing channel:", err);
      }
    },
  };
}
