"use client";

import { useState } from "react";
import { Button, Chip, Input, Sheet, Switch } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { normalisePhone } from "@/lib/phone";
import { useAddMember, type Kind } from "./api";
import { categoryName, type Category } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: Kind;
  /** In a minister's team the sheet adds a spouse or an aide instead of a delegate. */
  role?: "spouse" | "aide";
  title: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Add a member" (design 9b). Everyone gets their own ticket, sent to the email given. */
export function MemberSheet({ open, onOpenChange, kind, role, title }: Props) {
  const add = useAddMember(kind);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [category, setCategory] = useState<Category>("delegate");
  const [onsite, setOnsite] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setCategory("delegate");
    setOnsite(true);
    setErrors({});
    add.reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.full_name = "Enter their full name";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email";
    const e164 = normalisePhone(phone);
    if (phone.trim() && !/^\+[1-9]\d{7,14}$/.test(e164)) next.phone = "Enter a valid phone number";
    if (role === "aide" && !jobTitle.trim()) next.title = "What do they do for you?";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await add.mutateAsync({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(e164 ? { phone: e164 } : {}),
        mode: onsite ? "onsite" : "online",
        ...(role ? { role, ...(role === "aide" ? { title: jobTitle.trim() } : {}) } : { category }),
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErrors(err.fieldErrors);
      else setErrors({ form: err instanceof ApiError ? err.message : "Something went wrong." });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title={title}
    >
      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder="Funmi Adeleke"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.full_name}
        />
        <Input
          label="Email"
          type="email"
          inputMode="email"
          placeholder="funmi@example.com"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="Their ticket is sent here"
          error={errors.email}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+234 …"
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        {role === "aide" && (
          <Input
            label="Role"
            placeholder="Personal assistant"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            error={errors.title}
          />
        )}
        {!role && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">Category</span>
            <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
              {(Object.keys(categoryName) as Category[]).map((c) => (
                <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                  {categoryName[c]}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <Switch label="Attending onsite" checked={onsite} onChange={setOnsite} />
        {errors.form && (
          <p role="alert" className="text-sm text-brick-600">
            {errors.form}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth disabled={add.isPending}>
          {add.isPending ? "Adding…" : "Add & send ticket"}
        </Button>
      </form>
    </Sheet>
  );
}
