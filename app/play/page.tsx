"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { loadActiveSession } from "@/state/persistence";
import type { SessionState } from "@/state/session-machine";

export default function PlayPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Deferred to after mount: localStorage isn't available during SSR, and reading
    // it during render would produce a client/server hydration mismatch.
    const active = loadActiveSession();
    if (!active || active.phase.name === "session_complete") {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(active);
    setChecked(true);
  }, [router]);

  if (!checked || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-ink-muted">Loading…</p>
      </div>
    );
  }

  return <PracticeSession initialState={session} />;
}
