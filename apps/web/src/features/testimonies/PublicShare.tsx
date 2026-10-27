"use client";

import { useState } from "react";
import { ShareForm } from "./ShareForm";
import { SuccessCard } from "./SuccessCard";

export function PublicShare() {
  const [done, setDone] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-5 md:pt-14">
      <h1 className="mb-5 hidden font-display text-5xl font-bold uppercase text-cobalt-900 md:block">Share your testimony</h1>
      {done ? (
        <SuccessCard actionLabel="Back to testimonies" href="/testimonies" />
      ) : (
        <ShareForm variant="full" signedIn={false} onDone={() => setDone(true)} />
      )}
    </div>
  );
}
