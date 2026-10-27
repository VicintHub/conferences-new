import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("landing page", () => {
  it("labels every call-to-action 'Register Now' except the partner button", () => {
    render(<Home />);
    // Footer quick links are plain text links (design: "Register"), not buttons.
    const ctas = screen
      .getAllByRole("link")
      .filter((a) => !a.closest("footer"))
      .filter(
        (a) => a.getAttribute("href") === "/register" || a.getAttribute("href")?.startsWith("mailto:mivmandate2010@gmail.com?subject"),
      );
    expect(ctas.length).toBeGreaterThanOrEqual(8);
    for (const a of ctas) {
      const partner = a.getAttribute("href")?.startsWith("mailto:");
      expect(a).toHaveTextContent(partner ? /^PARTNER$/ : /^Register Now$/);
    }
  });

  it("shows the session list for the selected day", () => {
    render(<Home />);
    const panel = () => screen.getByRole("tabpanel");
    expect(within(panel()).getByText("Morning Plenary Session")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Tue 19" }));
    expect(within(panel()).getByText("Evening of Worship")).toBeInTheDocument();
    expect(within(panel()).queryByText("Morning Plenary Session")).not.toBeInTheDocument();
  });

  it("renders a countdown timer", () => {
    render(<Home />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });
});
