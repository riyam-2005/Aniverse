// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Mascot3DCanvas, { MASCOT_OUTFITS } from "./Mascot3DCanvas";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, priority, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

describe("Mascot3DCanvas", () => {
  beforeEach(() => {
    // Mock HTMLCanvasElement getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
    });

    globalThis.requestAnimationFrame = vi.fn().mockReturnValue(1);
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the 3D mascot avatar and outfits wardrobe button", () => {
    render(
      <Mascot3DCanvas
        src="/mascot-ani.png"
        alt="Ani Hologram"
        unlockedBadges={["VERIFIED"]}
      />
    );

    expect(screen.getByAltText("Ani Hologram")).toBeInTheDocument();
    expect(screen.getByText("Outfits")).toBeInTheDocument();
    expect(screen.getByText("✦ Cyber")).toBeInTheDocument();
  });

  it("opens wardrobe and displays unlockable skins with badge requirements", () => {
    render(
      <Mascot3DCanvas
        src="/mascot-ani.png"
        alt="Ani Hologram"
        unlockedBadges={["VERIFIED", "TOP_REVIEWER"]}
      />
    );

    const outfitsBtn = screen.getByText("Outfits");
    fireEvent.click(outfitsBtn);

    expect(screen.getByText("Mascot Wardrobe")).toBeInTheDocument();
    expect(screen.getByText("Critic Scholar Cape")).toBeInTheDocument();

    // ANIME_VETERAN is locked
    expect(screen.getByText("Veteran Titanium Armor")).toBeInTheDocument();
  });

  it("allows equipping an unlocked outfit", () => {
    render(
      <Mascot3DCanvas
        src="/mascot-ani.png"
        alt="Ani Hologram"
        unlockedBadges={["VERIFIED", "TOP_REVIEWER"]}
      />
    );

    fireEvent.click(screen.getByText("Outfits"));
    const criticCape = screen.getByText("Critic Scholar Cape");
    fireEvent.click(criticCape);

    // Indicator badge should update to Critic
    expect(screen.getByText("✦ Critic")).toBeInTheDocument();
  });
});
