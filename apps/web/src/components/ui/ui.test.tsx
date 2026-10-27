import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { remaining } from "./Countdown";
import { Button, Chip, Segmented, Stepper } from ".";

describe("remaining()", () => {
  it("splits a duration into d/h/m/s and clamps at zero", () => {
    const now = Date.parse("2027-01-19T17:00:00+01:00") - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    expect(remaining(Date.parse("2027-01-19T17:00:00+01:00"), now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(remaining(0, 1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("Button", () => {
  it("fires onClick and ignores clicks when disabled", () => {
    const fn = vi.fn();
    const { rerender } = render(<Button onClick={fn}>Register Now</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Register Now" }));
    expect(fn).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={fn} disabled>
        Register Now
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Register Now" }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("Chip / Segmented / Stepper", () => {
  it("exposes selected state", () => {
    render(<Chip selected>Tue 19</Chip>);
    expect(screen.getByRole("button", { name: "Tue 19" })).toHaveAttribute("aria-pressed", "true");
  });
  it("calls onChange with the chosen value", () => {
    const fn = vi.fn();
    render(
      <Segmented
        value="video"
        onChange={fn}
        options={[
          { value: "video", label: "Video" },
          { value: "radio", label: "Radio" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Radio" }));
    expect(fn).toHaveBeenCalledWith("radio");
  });
  it("reports progress", () => {
    render(<Stepper step={3} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });
});
