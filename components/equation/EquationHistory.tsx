import type { Equation } from "@/domain/equation";
import { EquationLine } from "./EquationLine";

/** Every previous transformation for the active question, oldest first, flowing downward above the active equation in a quieter style. */
export function EquationHistory({ history }: { history: Equation[] }) {
  if (history.length === 0) return null;

  return (
    <div className="mb-2 space-y-1 opacity-60">
      {history.map((equation, index) => (
        <EquationLine key={index} equation={equation} size="sm" />
      ))}
    </div>
  );
}
