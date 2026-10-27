import Image from "next/image";
import Link from "next/link";

/** Centered single-card layout for sign-in screens. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center bg-cream-50 px-5 pb-10 pt-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Image src="/images/miv-logo.png" alt="MIV" width={40} height={40} className="size-10 object-contain" />
        <span className="font-display text-lg font-bold uppercase text-cobalt-900">Jan. Conf 2027</span>
      </Link>
      <main className="flex w-full max-w-[420px] flex-col gap-4 rounded-[24px] border border-ink-100 bg-white p-6 shadow-md">
        <h1 className="text-[26px] font-bold leading-[1.15] text-cobalt-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
