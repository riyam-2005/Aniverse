// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ResetPasswordForm from "./ResetPasswordForm";

const pushMock = vi.fn();
let currentToken = "valid-token";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? currentToken : null),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    currentToken = "valid-token";
    pushMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows an invalid-link message when there is no token", () => {
    currentToken = "";
    render(<ResetPasswordForm />);

    expect(screen.getByText("Invalid link")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("blocks submission and shows a validation message for a weak password", () => {
    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "weak" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      screen.getByText("Your password doesn't meet the requirements below yet.")
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the live password checklist once the field is touched", () => {
    render(<ResetPasswordForm />);

    fireEvent.focus(screen.getByLabelText("New password"));

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
  });

  it("submits the token and password when the password is valid", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await screen.findByText("Password updated");

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "valid-token", password: "StrongPass1" }),
      })
    );
  });

  it("redirects to login shortly after a successful reset", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await screen.findByText("Password updated");
    expect(pushMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("shows the server's error message when the reset request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "This reset link has expired." }), {
        status: 400,
      })
    );

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("This reset link has expired.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
