// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Anime } from "@/types/anime";
import HeroSpotlight from "./HeroSpotlight";

// next/image and next/link pull in Next's router/runtime context that this
// isolated component test doesn't set up — swap them for plain DOM
// equivalents so we're testing HeroSpotlight's own logic, not Next's.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...rest
  }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src as string} alt={alt as string} {...rest} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeAnime(overrides: Partial<Anime>): Anime {
  return {
    mal_id: 1,
    title: "Default Title",
    images: { jpg: { image_url: "https://example.com/default.jpg" } },
    ...overrides,
  };
}

describe("HeroSpotlight", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders nothing when no items have a usable image", () => {
    const items = [makeAnime({ mal_id: 1, title: "No Image", images: { jpg: { image_url: "" } } })];
    const { container } = render(<HeroSpotlight items={items} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an empty item list", () => {
    const { container } = render(<HeroSpotlight items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the first slide's title and spotlight rank", () => {
    const items = [
      makeAnime({ mal_id: 1, title: "First Anime" }),
      makeAnime({ mal_id: 2, title: "Second Anime" }),
    ];
    render(<HeroSpotlight items={items} />);

    expect(screen.getByRole("heading", { name: "First Anime" })).toBeInTheDocument();
    expect(screen.getByText("#1 Spotlight")).toBeInTheDocument();
    expect(screen.getByText("01 / 02")).toBeInTheDocument();
  });

  it("does not show navigation arrows or a counter for a single slide", () => {
    const items = [makeAnime({ mal_id: 1, title: "Only Anime" })];
    render(<HeroSpotlight items={items} />);

    expect(screen.queryByRole("button", { name: "Next spotlight" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous spotlight" })).not.toBeInTheDocument();
  });

  it("switches slides when a dot indicator is clicked", () => {
    const items = [
      makeAnime({ mal_id: 1, title: "First Anime" }),
      makeAnime({ mal_id: 2, title: "Second Anime" }),
    ];
    render(<HeroSpotlight items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "Go to spotlight 2" }));

    expect(screen.getByRole("heading", { name: "Second Anime" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "First Anime" })).not.toBeInTheDocument();
  });

  it("wraps around when the next arrow is clicked on the last slide", () => {
    const items = [
      makeAnime({ mal_id: 1, title: "First Anime" }),
      makeAnime({ mal_id: 2, title: "Second Anime" }),
    ];
    render(<HeroSpotlight items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "Next spotlight" }));
    expect(screen.getByRole("heading", { name: "Second Anime" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next spotlight" }));
    expect(screen.getByRole("heading", { name: "First Anime" })).toBeInTheDocument();
  });

  it("auto-advances slides on a timer", () => {
    vi.useFakeTimers();
    const items = [
      makeAnime({ mal_id: 1, title: "First Anime" }),
      makeAnime({ mal_id: 2, title: "Second Anime" }),
    ];
    render(<HeroSpotlight items={items} />);

    expect(screen.getByRole("heading", { name: "First Anime" })).toBeInTheDocument();

    vi.advanceTimersByTime(6500);

    expect(screen.getByRole("heading", { name: "Second Anime" })).toBeInTheDocument();
  });

  it("pauses autoplay while the mouse is over the spotlight", () => {
    vi.useFakeTimers();
    const items = [
      makeAnime({ mal_id: 1, title: "First Anime" }),
      makeAnime({ mal_id: 2, title: "Second Anime" }),
    ];
    const { container } = render(<HeroSpotlight items={items} />);
    const section = container.querySelector("section")!;

    fireEvent.mouseEnter(section);
    vi.advanceTimersByTime(10000);

    expect(screen.getByRole("heading", { name: "First Anime" })).toBeInTheDocument();

    fireEvent.mouseLeave(section);
    vi.advanceTimersByTime(6500);

    expect(screen.getByRole("heading", { name: "Second Anime" })).toBeInTheDocument();
  });

  it("only includes items that have a usable image in the slide set", () => {
    const items = [
      makeAnime({ mal_id: 1, title: "Has Image" }),
      makeAnime({ mal_id: 2, title: "No Image", images: { jpg: { image_url: "" } } }),
      makeAnime({ mal_id: 3, title: "Also Has Image" }),
    ];
    render(<HeroSpotlight items={items} />);

    // Only 2 of the 3 items are valid slides.
    expect(screen.getByText("01 / 02")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No Image" })).not.toBeInTheDocument();
  });
});
