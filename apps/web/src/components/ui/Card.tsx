import { cn } from "@/lib/cn";

type Props = {
  tone?: "light" | "cobalt";
  padded?: boolean;
  as?: "div" | "section" | "article";
  children: React.ReactNode;
};

export function Card({ tone = "light", padded = true, as: Tag = "div", children }: Props) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-card)] border",
        tone === "light" ? "border-ink-100 bg-white text-ink-700" : "border-transparent bg-cobalt-900 text-white",
        padded && "p-5",
      )}
    >
      {children}
    </Tag>
  );
}
