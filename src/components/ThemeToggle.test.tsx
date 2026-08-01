// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("light");
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("defaults to dark theme and shows a control to switch to light", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" })
    ).toBeInTheDocument();
  });

  it("detects light theme from the <html> element's class on mount", () => {
    document.documentElement.classList.add("light");
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" })
    ).toBeInTheDocument();
  });

  it("toggles the theme, the <html> class, and persists the choice on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });

    fireEvent.click(button);

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("doesn't crash when localStorage is unavailable (e.g. private browsing)", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage disabled");
      });

    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });

    expect(() => fireEvent.click(button)).not.toThrow();
    // The in-memory theme state (and the <html> class) still flip even
    // though persistence silently failed.
    expect(document.documentElement.classList.contains("light")).toBe(true);

    setItemSpy.mockRestore();
  });

  it("applies the passed-in className to the toggle button", () => {
    render(<ThemeToggle className="custom-class" />);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" })
    ).toHaveClass("custom-class");
  });
});
