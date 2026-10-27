import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let search = "email=ade%40example.com&token=abc";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(search) }));

import { LoginFlow } from "./LoginFlow";
import { VerifyLink } from "./VerifyLink";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const registration = (existing: boolean) => ({
  data: {
    claim_code: "JC27-DLG-48213",
    category: "delegate",
    mode: "onsite",
    attendee: { first_name: "Adebayo", full_name: "Adebayo Ogunleye", email: "ade@example.com" },
  },
  meta: { downgraded_to_online: false, existing_account: existing },
});

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

beforeEach(() => {
  localStorage.clear();
  push.mockReset();
  search = "email=ade%40example.com&token=abc";
});
afterEach(() => vi.unstubAllGlobals());

describe("VerifyLink", () => {
  it("spends the link once and confirms a new registration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(registration(false)));
    vi.stubGlobal("fetch", fetchMock);
    wrap(<VerifyLink />);
    expect(await screen.findByText("You’re in, Adebayo")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "ade@example.com", token: "abc" });
  });

  it("welcomes a returning attendee back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(registration(true))));
    wrap(<VerifyLink />);
    expect(await screen.findByText("Welcome back, Adebayo")).toBeInTheDocument();
    expect(screen.queryByText("Stay in the loop")).not.toBeInTheDocument();
  });

  it("explains an expired or used link and offers a new code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "x", code: "invalid_otp" }, 422)));
    wrap(<VerifyLink />);
    expect(await screen.findByText(/expired or was already used/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get a new code" })).toHaveAttribute("href", "/login");
  });

  it("rejects an incomplete link without calling the API", async () => {
    search = "email=ade%40example.com";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    wrap(<VerifyLink />);
    expect(await screen.findByText(/incomplete/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("LoginFlow", () => {
  it("emails a code then signs in and goes to the app", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) =>
      url.endsWith("/auth/otp") ? json({ resend_after: 60 }, 202) : json(registration(true)),
    );
    vi.stubGlobal("fetch", fetchMock);
    wrap(<LoginFlow />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "Ade@Example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByText("Check your email");
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ email: "ade@example.com" });

    fireEvent.change(screen.getByLabelText("Digit 1"), { target: { value: "123456" } });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app"));
  });

  it("validates the email address before sending", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    wrap(<LoginFlow />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
