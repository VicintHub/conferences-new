export const metadata = { title: "Offline — Jan. Conf 2027" };

export default function Page() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-cream-50 px-8 text-center">
      <h1 className="text-[23px] font-bold text-cobalt-900">You’re offline</h1>
      <p className="max-w-xs text-[15px] text-ink-500">
        This page isn’t saved on your phone yet. Your pass and programme are available from the app once you’ve opened them online.
      </p>
      <a href="/app/pass" className="mt-2 font-semibold text-cobalt-700">
        Open my pass
      </a>
    </main>
  );
}
