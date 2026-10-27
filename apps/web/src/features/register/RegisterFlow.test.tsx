import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterFlow } from "./RegisterFlow";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const registration = {
  data: {
    claim_code: "JC27-DLG-48213",
    category: "delegate",
    mode: "onsite",
    attendee: { first_name: "Adebayo", full_name: "Adebayo Ogunleye", email: "ade@example.com" },
  },
  meta: { downgraded_to_online: false, existing_account: false },
};

function mockApi({ capacity = { taken: 1846, limit: 2500, full: false }, verify = () => json(registration) as Response } = {}) {
  const calls: { url: string; body?: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : undefined });
      if (url.endsWith("/capacity")) return json({ data: { onsite: capacity } });
      if (url.endsWith("/registrations") || url.endsWith("/auth/otp")) return json({ resend_after: 60 }, 202);
      if (url.endsWith("/api/auth/verify")) return verify();
      return json({}, 404);
    }),
  );
  return calls;
}

const renderFlow = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RegisterFlow />
    </QueryClientProvider>,
  );

const next = (name = "Continue") => fireEvent.click(screen.getByRole("button", { name }));
const agree = () => fireEvent.click(screen.getByRole("checkbox"));

async function toAttendance() {
  next();
  fireEvent.change(await screen.findByLabelText(/full name/i), { target: { value: "Adebayo Ogunleye" } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "Ade@Example.com" } });
  next();
  await screen.findByText("How will you attend?", { selector: "h1" });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("RegisterFlow", () => {
  it("requires an email but not a phone number", async () => {
    mockApi();
    renderFlow();
    next();
    await screen.findByText("About you", { selector: "h1" });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Adebayo Ogunleye" } });
    next();
    expect(await screen.findByText("Enter your email address")).toBeInTheDocument();
    expect(screen.getByText("About you", { selector: "h1" })).toBeInTheDocument();
  });

  it("shows the live capacity meter", async () => {
    mockApi();
    renderFlow();
    await toAttendance();
    expect(await screen.findByText(/1,846 \/ 2,500 onsite places taken/i)).toBeInTheDocument();
  });

  it("disables onsite and defaults to online when the cap is full", async () => {
    mockApi({ capacity: { taken: 2500, limit: 2500, full: true } });
    renderFlow();
    await toAttendance();
    expect(await screen.findByText(/onsite places are full/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /onsite in ibadan/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /^online/i })).toBeChecked();
  });

  it("needs consent before the code is sent", async () => {
    const calls = mockApi();
    renderFlow();
    await toAttendance();
    next();
    expect(await screen.findByText("Please agree to continue")).toBeInTheDocument();
    expect(calls.some((c) => c.url.endsWith("/registrations"))).toBe(false);
  });

  it("emails a code, then registers end to end and offers notifications", async () => {
    const calls = mockApi();
    renderFlow();
    await toAttendance();
    agree();
    next();

    await screen.findByText("Enter the code", { selector: "h1" });
    expect(screen.getByText("ade@example.com")).toBeInTheDocument();
    expect(screen.getByText(/or tap the link in the email/i)).toBeInTheDocument();
    expect(screen.getByText(/resend in 1:00/i)).toBeInTheDocument();
    expect(calls.find((c) => c.url.endsWith("/registrations"))?.body).toMatchObject({
      email: "ade@example.com",
      phone: null,
      consent: true,
      mode: "onsite",
      category: "delegate",
    });

    fireEvent.change(screen.getByLabelText("Digit 1"), { target: { value: "482100" } });

    expect(await screen.findByText("You’re in, Adebayo")).toBeInTheDocument();
    expect(screen.getByText("JC27-DLG-48213")).toBeInTheDocument();
    expect(await screen.findByText("Stay in the loop")).toBeInTheDocument();
    expect(calls.find((c) => c.url.endsWith("/api/auth/verify"))?.body).toEqual({ email: "ade@example.com", code: "482100" });
    await waitFor(() => expect(JSON.parse(localStorage.getItem("jc27.ticket")!).claim_code).toBe("JC27-DLG-48213"));
  });

  it("shows an error for a wrong code and lets the user retry", async () => {
    mockApi({ verify: () => json({ message: "That code or link is incorrect or has expired.", code: "invalid_otp" }, 422) });
    renderFlow();
    await toAttendance();
    agree();
    next();
    await screen.findByText("Enter the code", { selector: "h1" });
    fireEvent.change(screen.getByLabelText("Digit 1"), { target: { value: "000000" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect or has expired/i);
    expect(screen.getByText("Enter the code", { selector: "h1" })).toBeInTheDocument();
  });
});
