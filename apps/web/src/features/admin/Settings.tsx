"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Input, Switch } from "@/components/ui";
import { duration } from "@/features/live/types";
import { ApiError } from "@/lib/api";
import { admin, json, useAdminMe } from "./api";
import type { Settings as SettingsData, Staff } from "./types";
import { Card, Loading, PageHeader, Problem, Table, Tag } from "./ui";

/** Settings: the live stream, replays, and (for admins) who is on the staff list. */
export function Settings() {
  const me = useAdminMe();
  const q = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await admin<{ data: SettingsData }>("settings")).data });
  const isAdmin = me.data?.data.areas.includes("staff");

  if (q.isPending) return <Loading rows={4} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      <LiveForm live={q.data.live} />
      <Replays replays={q.data.replays} />
      {isAdmin && <StaffList selfId={me.data?.data.id} />}
    </div>
  );
}

function LiveForm({ live }: { live: SettingsData["live"] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    is_live: live.is_live,
    title: live.title ?? "",
    video_url: live.video_url ?? "",
    radio_url: live.radio_url ?? "",
    poster: live.poster ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form, v: string | boolean) => (setForm((f) => ({ ...f, [k]: v })), setSaved(false));

  const save = useMutation({
    mutationFn: () =>
      admin(
        "settings/live",
        json("PUT", {
          ...form,
          title: form.title || null,
          video_url: form.video_url || null,
          radio_url: form.radio_url || null,
          poster: form.poster || null,
        }),
      ),
    onSuccess: () => {
      setSaved(true);
      setErrors({});
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: ApiError) =>
      setErrors(e.status === 422 ? { ...e.fieldErrors, form: e.fieldErrors.video_url ? "" : e.message } : { form: e.message }),
  });

  return (
    <Card className="flex max-w-[720px] flex-col gap-4 p-6">
      <h2 className="text-lg font-bold text-ink-900">Live stream</h2>
      <p className="text-sm text-ink-500">
        What attendees see on the Live tab. Video can be an HLS (.m3u8) link, a YouTube or Vimeo link, or a video file.
      </p>
      <Switch label="We are live now" checked={form.is_live} onChange={(v) => set("is_live", v)} />
      <Input
        label="Title shown while live"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Royal Conference"
      />
      <Input
        label="Video link"
        value={form.video_url}
        onChange={(e) => set("video_url", e.target.value)}
        placeholder="https://…/live.m3u8"
        error={errors.video_url}
      />
      <Input
        label="Radio (audio) link"
        value={form.radio_url}
        onChange={(e) => set("radio_url", e.target.value)}
        placeholder="https://…/radio"
        error={errors.radio_url}
      />
      <Input
        label="Poster image (optional)"
        value={form.poster}
        onChange={(e) => set("poster", e.target.value)}
        placeholder="https://…/poster.jpg"
      />
      {(errors.form || errors.message) && (
        <p role="alert" className="text-sm text-brick-600">
          {errors.form || errors.message}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm font-semibold text-success-600">
          Saved.
        </p>
      )}
      <div>
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save stream settings"}
        </Button>
      </div>
    </Card>
  );
}

function Replays({ replays }: { replays: SettingsData["replays"] }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "settings"] });
  const [draft, setDraft] = useState({ title: "", recorded_on: "", minutes: "", video_url: "" });
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () =>
      admin(
        "replays",
        json("POST", {
          title: draft.title,
          recorded_on: draft.recorded_on,
          duration_seconds: Math.round(Number(draft.minutes) * 60),
          video_url: draft.video_url || null,
        }),
      ),
    onSuccess: () => {
      setDraft({ title: "", recorded_on: "", minutes: "", video_url: "" });
      setError(null);
      void refresh();
    },
    onError: (e: ApiError) => setError(Object.values(e.fieldErrors)[0] ?? e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => admin(`replays/${id}`, json("PATCH", body)),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: number) => admin(`replays/${id}`, json("DELETE")), onSuccess: refresh });
  const [links, setLinks] = useState<Record<number, string>>({});

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink-900">Replays</h2>
      <Table head={["Replay", "Recorded", "Length", "Video link", ""]} empty={replays.length === 0 ? "No replays yet." : undefined}>
        {replays.map((r) => (
          <tr key={r.id} className="border-t border-ink-50">
            <td className="px-5 py-3.5 font-bold text-ink-900">{r.title}</td>
            <td className="px-5 py-3.5">{r.recorded_on}</td>
            <td className="px-5 py-3.5">{duration(r.duration_seconds)}</td>
            <td className="px-5 py-3.5">
              <span className="flex items-center gap-2">
                <input
                  aria-label={`Video link for ${r.title}`}
                  value={links[r.id] ?? r.video_url ?? ""}
                  onChange={(e) => setLinks((l) => ({ ...l, [r.id]: e.target.value }))}
                  placeholder="Not published yet"
                  className="w-56 rounded-lg border border-ink-200 px-3 py-1.5 text-sm"
                />
                {links[r.id] !== undefined && links[r.id] !== (r.video_url ?? "") && (
                  <button
                    type="button"
                    onClick={() => patch.mutate({ id: r.id, body: { video_url: links[r.id] || null } })}
                    className="text-sm font-bold text-cobalt-700"
                  >
                    Save
                  </button>
                )}
              </span>
            </td>
            <td className="px-5 py-3.5 text-right text-sm font-bold">
              <button
                type="button"
                onClick={() => window.confirm(`Delete “${r.title}”?`) && remove.mutate(r.id)}
                className="text-brick-600"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <Card className="grid gap-3 p-5 md:grid-cols-[2fr_1fr_1fr_2fr_auto] md:items-end">
        <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Input
          label="Recorded on"
          type="date"
          value={draft.recorded_on}
          onChange={(e) => setDraft({ ...draft, recorded_on: e.target.value })}
        />
        <Input
          label="Minutes"
          type="number"
          min={1}
          value={draft.minutes}
          onChange={(e) => setDraft({ ...draft, minutes: e.target.value })}
        />
        <Input label="Video link (optional)" value={draft.video_url} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
        <Button disabled={add.isPending || !draft.title || !draft.recorded_on || !draft.minutes} onClick={() => add.mutate()}>
          Add replay
        </Button>
      </Card>
      {error && (
        <p role="alert" className="text-sm text-brick-600">
          {error}
        </p>
      )}
    </section>
  );
}

type StaffResponse = { data: Staff[]; meta: { roles: { key: string; label: string }[] } };

function StaffList({ selfId }: { selfId?: number }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "staff"], queryFn: () => admin<StaffResponse>("staff") });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "staff"] });
  const [draft, setDraft] = useState({ name: "", email: "", role: "registration", title: "" });
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () => admin("staff", json("POST", draft)),
    onSuccess: () => {
      setDraft({ name: "", email: "", role: "registration", title: "" });
      setError(null);
      void refresh();
    },
    onError: (e: ApiError) => setError(Object.values(e.fieldErrors)[0] ?? e.message),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => admin(`staff/${id}`, json("PATCH", body)),
    onSuccess: () => (setError(null), refresh()),
    onError: (e: ApiError) => setError(e.message),
  });

  if (q.isPending) return <Loading rows={2} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink-900">Staff</h2>
      <Table head={["Name", "Role", "Status", ""]}>
        {q.data.data.map((s) => (
          <tr key={s.id} className="border-t border-ink-50">
            <td className="px-5 py-3.5">
              <span className="flex flex-col">
                <span className="font-bold text-ink-900">{s.name}</span>
                <span className="text-xs text-ink-500">{s.email}</span>
              </span>
            </td>
            <td className="px-5 py-3.5">
              <select
                aria-label={`Role for ${s.name}`}
                value={s.role}
                disabled={s.id === selfId}
                onChange={(e) => patch.mutate({ id: s.id, body: { role: e.target.value } })}
                className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {q.data.meta.roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-5 py-3.5">{s.active ? <Tag tone="success">Active</Tag> : <Tag tone="neutral">Inactive</Tag>}</td>
            <td className="px-5 py-3.5 text-right text-sm font-bold">
              {s.id !== selfId && (
                <button
                  type="button"
                  onClick={() => patch.mutate({ id: s.id, body: { active: !s.active } })}
                  className={s.active ? "text-brick-600" : "text-cobalt-700"}
                >
                  {s.active ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Card className="grid gap-3 p-5 md:grid-cols-[1.5fr_2fr_1fr_1.5fr_auto] md:items-end">
        <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-role" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
            Role
          </label>
          <select
            id="staff-role"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 bg-white px-3 py-3 text-base"
          >
            {q.data.meta.roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Title (optional)"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Registration lead"
        />
        <Button disabled={add.isPending || !draft.name || !draft.email} onClick={() => add.mutate()}>
          Add
        </Button>
      </Card>
      {error && (
        <p role="alert" className="text-sm text-brick-600">
          {error}
        </p>
      )}
    </section>
  );
}
