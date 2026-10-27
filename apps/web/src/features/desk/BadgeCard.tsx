import Image from "next/image";
import { QR } from "@/components/ui";
import { cn } from "@/lib/cn";
import { categoryName, type DeskCard } from "./types";

/** The badge as it prints (design 16a): cobalt card, brick edge, name large, QR the scanners read. */
export function BadgeCard({
  card,
  className,
}: {
  card: Pick<DeskCard, "name" | "church" | "category" | "claim_code">;
  className?: string;
}) {
  const [first, ...rest] = card.name.trim().split(/\s+/);
  const last = rest.join(" ");
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] w-full flex-col overflow-hidden rounded-3xl bg-cobalt-800 p-6 text-white shadow-xl",
        className,
      )}
      data-badge
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-2.5 bg-brick-600" />
      <div className="mt-2 flex items-center justify-between">
        <Image src="/images/miv-logo.png" alt="" width={44} height={44} className="size-11 object-contain" />
        <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-cobalt-100">Jan. Conf 2027</span>
      </div>
      <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.12em] text-brick-300">
        {categoryName[card.category].replace(" delegate", "")}
      </p>
      <p className="mt-2 font-display text-[44px] font-bold uppercase leading-[0.95]">
        {first}
        {last && (
          <>
            <br />
            {last}
          </>
        )}
      </p>
      {card.church && <p className="mt-3 text-[15px] text-cobalt-100">{card.church}</p>}
      <div className="mt-auto flex justify-center">
        <div className="rounded-2xl bg-white p-3">
          <QR value={card.claim_code} size={120} label={`Badge code ${card.claim_code}`} />
        </div>
      </div>
    </div>
  );
}
