"use client";

import { useState } from "react";
import { Badge, Button, Card, Chip, Countdown, Input, QR, Segmented, Sheet, Stepper, TabBar, type TabKey } from "@/components/ui";

const days = ["Tue 19", "Wed 20", "Thu 21", "Fri 22", "Sat 23", "Sun 24"];
const swatches = [
  ["cobalt", [950, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50]],
  ["brick", [900, 800, 700, 600, 500, 400, 300, 200, 100]],
  ["cream", [50, 100, 200, 300]],
  ["ink", [950, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50]],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className="eyebrow mb-4">{title}</p>
      {children}
    </section>
  );
}

export function KitchenSink() {
  const [picked, setPicked] = useState<string[]>(["Tue 19", "Wed 20", "Thu 21", "Sat 23", "Sun 24"]);
  const [mode, setMode] = useState<"video" | "radio">("video");
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");

  return (
    <main className="mx-auto max-w-[960px] px-5 py-12">
      <h1 className="font-display-caps mb-10 text-[56px] text-cobalt-900">
        Kitchen <span className="text-brick-600">sink</span>
      </h1>

      <Section title="Colour tokens">
        <div className="grid gap-3">
          {swatches.map(([name, steps]) => (
            <div key={name} className="flex gap-1">
              {steps.map((s) => (
                <div key={s} title={`${name}-${s}`} className="h-12 flex-1 rounded" style={{ background: `var(--color-${name}-${s})` }} />
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <p className="font-display-caps text-[72px] text-cobalt-900">19th – 24th Jan</p>
        <h2 className="mt-4 text-[26px] font-bold text-cobalt-900">Sentence-case Barlow heading</h2>
        <p className="mt-2 max-w-prose text-base">Body copy in Barlow 400 at 16px. Registration is free for every delegate.</p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Register Now</Button>
          <Button variant="accent">Register Now</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <span className="rounded-2xl bg-cobalt-900 p-3">
            <Button variant="onDark">On dark</Button>
          </span>
          <Button size="sm">Small</Button>
          <Button size="lg" display>
            Large display
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges, chips, segmented">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>Delegate</Badge>
          <Badge tone="brick">Minister</Badge>
          <Badge tone="success" dot>
            Onsite
          </Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="neutral">Online</Badge>
          <span className="rounded bg-cobalt-900 p-1">
            <Badge tone="outlineDark">Delegate</Badge>
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2.5">
          {days.map((d) => (
            <Chip
              key={d}
              selected={picked.includes(d)}
              onClick={() => setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
            >
              {d}
            </Chip>
          ))}
        </div>
        <div className="max-w-sm">
          <Segmented
            label="Stream mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "video", label: "Video" },
              { value: "radio", label: "Radio" },
            ]}
          />
        </div>
      </Section>

      <Section title="Inputs & stepper">
        <div className="grid max-w-sm gap-4">
          <Stepper step={3} />
          <Input label="Full name" placeholder="Adebayo Ogunleye" required />
          <Input label="Phone" prefix="+234" placeholder="803 000 0000" hint="Used to sign in." />
          <Input label="Email" defaultValue="not-an-email" error="Enter a valid email address." />
        </div>
      </Section>

      <Section title="Cards, countdown, QR">
        <div className="grid gap-4 md:grid-cols-2">
          <Card tone="cobalt">
            <Countdown />
            <p className="mt-4 text-sm text-cobalt-200">to Evening of Worship · Tue 19 Jan</p>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <QR value="JC27-DLG-48213" size={88} label="Claim ticket JC27-DLG-48213" />
              <div>
                <p className="font-bold text-ink-900">Claim ticket</p>
                <p className="text-sm text-ink-400">JC27-DLG-48213</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="mt-4 rounded-2xl bg-cobalt-950 py-10">
          <Countdown variant="hero" />
        </div>
      </Section>

      <Section title="Sheet & drawer">
        <div className="flex gap-3">
          <Button onClick={() => setOpen(true)}>Open bottom sheet</Button>
          <Button variant="outline" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen} title="Stay in the loop" description="Get schedule changes and live alerts.">
          <div className="mt-6 grid gap-2">
            <Button fullWidth onClick={() => setOpen(false)}>
              Turn on notifications
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setOpen(false)}>
              Not now
            </Button>
          </div>
        </Sheet>
        <Sheet open={drawer} onOpenChange={setDrawer} side="right" title="Speaker profile">
          <div className="p-8 pt-16">
            <h2 className="font-display-caps text-5xl text-cobalt-900">Speaker drawer</h2>
          </div>
        </Sheet>
      </Section>

      <Section title="Tab bar">
        <div className="max-w-[402px] overflow-hidden rounded-2xl border border-ink-100">
          <TabBar active={tab} />
        </div>
        <div className="mt-3 flex gap-2">
          {(["home", "prog", "pass", "live", "more"] as TabKey[]).map((k) => (
            <Chip key={k} selected={tab === k} onClick={() => setTab(k)}>
              {k}
            </Chip>
          ))}
        </div>
      </Section>
    </main>
  );
}
