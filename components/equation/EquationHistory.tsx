"use client";

import { useState } from "react";
import type { Equation } from "@/domain/equation";
import { EquationLine } from "./EquationLine";

/** Preserves the previous transformations above the active equation, in a quieter style. */
export function EquationHistory({ history }: { history: Equation[] }) {
  const [expanded, setExpanded] = useState(false);
  if (history.length === 0) return null;

  const visible = history.slice(-2);

  return (
    <div className="mb-2">
      {history.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-1 text-sm font-medium text-ink-muted underline decoration-dotted underline-offset-4 hover:text-ink sm:hidden"
        >
          {expanded ? "Hide previous lines" : "Show previous lines"}
        </button>
      )}
      <div className={`${expanded ? "block" : "hidden"} sm:block space-y-1 opacity-60`}>
        {(expanded ? history : visible).map((equation, index) => (
          <EquationLine key={index} equation={equation} size="sm" />
        ))}
      </div>
    </div>
  );
}
