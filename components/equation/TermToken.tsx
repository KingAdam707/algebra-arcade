import type { FormattedTerm } from "@/domain/formatter";

/** One signed term in an equation line: an operator (except the leading term) plus its magnitude. */
export function TermToken({ term, muted = false }: { term: FormattedTerm; muted?: boolean }) {
  const showOperator = !term.isLeading || term.sign === "-";
  const operatorText = term.isLeading ? (term.sign === "-" ? "−" : "") : term.sign === "-" ? "−" : "+";

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${muted ? "text-ink-faint" : "text-ink"}`}>
      {showOperator && operatorText && (
        <span aria-hidden="true" className="font-math">
          {operatorText}
        </span>
      )}
      <TermMagnitude term={term} />
    </span>
  );
}

function TermMagnitude({ term }: { term: FormattedTerm }) {
  if (term.magnitude.kind === "fraction") {
    return (
      <span className="inline-flex items-center gap-0.5 font-math">
        <span className="inline-flex flex-col items-center justify-center text-center leading-none">
          <span className="border-b border-current px-0.5">{term.magnitude.numerator}</span>
          <span className="px-0.5">{term.magnitude.denominator}</span>
        </span>
        {term.variable && <span className="variable">x</span>}
      </span>
    );
  }

  const isBareVariable = term.variable && term.magnitude.value === 1;
  return (
    <span className="font-math">
      {!isBareVariable && <span>{term.magnitude.value}</span>}
      {term.variable && <span className="variable">x</span>}
    </span>
  );
}
