// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import WatchPartyModal from "@/components/features/watchlist/WatchPartyModal";

vi.mock("@/core/clients/realtime", () => ({
  generateRoomCode: (id: number) => `ANI-${id}-TEST`,
  subscribeToWatchPartyRoom: vi.fn().mockReturnValue({
    broadcastPlayerState: vi.fn(),
    broadcastChatMessage: vi.fn(),
    broadcastReaction: vi.fn(),
    leave: vi.fn(),
  }),
}));

describe("WatchPartyModal", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <WatchPartyModal
        animeMalId={16498}
        animeTitle="Attack on Titan"
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText("Watch Party:")).not.toBeInTheDocument();
  });

  it("renders with anime title, episode timer, and controls when isOpen is true", () => {
    render(
      <WatchPartyModal
        animeMalId={16498}
        animeTitle="Attack on Titan"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Watch Party:")).toBeInTheDocument();
    expect(screen.getByText("Attack on Titan")).toBeInTheDocument();
    expect(screen.getByText("▶ Play Room")).toBeInTheDocument();
  });

  it("toggles play state when play/pause button is clicked", () => {
    render(
      <WatchPartyModal
        animeMalId={16498}
        animeTitle="Attack on Titan"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const playBtn = screen.getByText("▶ Play Room");
    fireEvent.click(playBtn);

    expect(screen.getByText("⏸ Pause Room")).toBeInTheDocument();
  });

  it("invokes onClose callback when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <WatchPartyModal
        animeMalId={16498}
        animeTitle="Attack on Titan"
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByLabelText("Close watch party modal");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
