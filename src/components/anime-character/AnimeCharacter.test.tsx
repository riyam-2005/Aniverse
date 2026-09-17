// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AnimeCharacter from "./AnimeCharacter";
import { DEFAULT_MASCOT_CONFIG } from "./character-config";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

describe("AnimeCharacter", () => {
  beforeEach(() => {
    // Setup window matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Setup IntersectionObserver mock
    globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the mascot character image and default speech message", () => {
    render(<AnimeCharacter />);

    const mascotImg = screen.getByAltText(DEFAULT_MASCOT_CONFIG.alt);
    expect(mascotImg).toBeInTheDocument();
    expect(mascotImg).toHaveAttribute("src", DEFAULT_MASCOT_CONFIG.assetPath);

    // Initial section message
    expect(
      screen.getByText(DEFAULT_MASCOT_CONFIG.sections[0].message)
    ).toBeInTheDocument();
  });

  it("allows dismissing the speech bubble via the close button", () => {
    render(<AnimeCharacter />);

    const dismissBtn = screen.getByTitle("Close dialogue");
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(DEFAULT_MASCOT_CONFIG.sections[0].message)
    ).not.toBeInTheDocument();
  });

  it("triggers interactive dialogue when the mascot is clicked", () => {
    render(<AnimeCharacter />);

    const mascotContainer = screen.getByText("✨ Click me!");
    fireEvent.click(mascotContainer);

    // The speech bubble should be present with Ani badge
    expect(screen.getByText(DEFAULT_MASCOT_CONFIG.name)).toBeInTheDocument();
  });

  it("supports reduced-motion mode by rendering static layout", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<AnimeCharacter />);
    expect(screen.getByAltText(DEFAULT_MASCOT_CONFIG.alt)).toBeInTheDocument();
  });
});
