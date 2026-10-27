import { Check } from "lucide-react";
import { Button } from "@/components/ui";

/** "Thank you!" after submitting (design 13e). `overlay` dims the page behind it; otherwise it sits inline. */
export function SuccessCard({
  overlay,
  actionLabel,
  onAction,
  href,
}: {
  overlay?: boolean;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
}) {
  const card = (
    <div
      role="status"
      className="flex w-full max-w-[420px] flex-col items-center gap-3.5 rounded-[28px] bg-white px-6 pb-6 pt-8 text-center"
    >
      <span className="flex size-[88px] items-center justify-center rounded-full bg-cobalt-50">
        <span className="flex size-[60px] items-center justify-center rounded-full bg-cobalt-600">
          <Check size={30} strokeWidth={3} className="text-white" />
        </span>
      </span>
      <span className="text-2xl font-bold text-cobalt-700">Thank you!</span>
      <span className="text-sm leading-[1.5] text-ink-500">
        Your testimony has been sent to the media team. We’ll let you know when it’s published.
      </span>
      <div className="mt-1.5 w-full">
        <Button size="lg" fullWidth href={href} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
  return overlay ? <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-ink-700 px-6 pt-[200px]">{card}</div> : card;
}
