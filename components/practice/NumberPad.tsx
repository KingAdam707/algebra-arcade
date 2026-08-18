"use client";

export type NumericEntryValue = {
  numerator: string;
  denominator: string;
  isFraction: boolean;
  negative: boolean;
  variable: boolean;
};

export const EMPTY_NUMERIC_ENTRY: NumericEntryValue = {
  numerator: "",
  denominator: "",
  isFraction: false,
  negative: false,
  variable: false,
};

export function isNumericEntryComplete(value: NumericEntryValue): boolean {
  if (value.numerator === "") return false;
  if (value.isFraction && value.denominator === "") return false;
  return true;
}

export function numericEntryToRaw(value: NumericEntryValue): { numerator: number; denominator: number } {
  const magnitude = value.numerator === "" ? 0 : Number.parseInt(value.numerator, 10);
  const denominator = value.isFraction ? (value.denominator === "" ? 1 : Number.parseInt(value.denominator, 10)) : 1;
  return { numerator: value.negative ? -magnitude : magnitude, denominator };
}

const MAX_DIGITS = 4;

function appendDigit(text: string, digit: string): string {
  if (text.length >= MAX_DIGITS) return text;
  if (text === "0") return digit; // Replace a lone leading zero rather than producing "01".
  return text + digit;
}

export type NumberPadOptions = {
  allowNegative?: boolean;
  allowFraction?: boolean;
  allowVariable?: boolean;
};

/** A tactile digit pad for building an exact rational (and optionally an x-term) answer. */
export function NumberPad({
  value,
  onChange,
  allowNegative = false,
  allowFraction = false,
  allowVariable = false,
  label,
}: NumberPadOptions & {
  value: NumericEntryValue;
  onChange: (value: NumericEntryValue) => void;
  label: string;
}) {
  const activeField = value.isFraction && value.numerator !== "" ? "denominator" : "numerator";
  // Once the numerator has content and fraction mode is on, digits target the denominator.
  const targetField: "numerator" | "denominator" = value.isFraction
    ? value.numerator === "" || activeField === "numerator"
      ? "numerator"
      : "denominator"
    : "numerator";

  function pressDigit(digit: string) {
    if (targetField === "numerator") {
      onChange({ ...value, numerator: appendDigit(value.numerator, digit) });
    } else {
      onChange({ ...value, denominator: appendDigit(value.denominator, digit) });
    }
  }

  function pressBackspace() {
    if (targetField === "denominator" && value.denominator !== "") {
      onChange({ ...value, denominator: value.denominator.slice(0, -1) });
    } else if (targetField === "denominator") {
      onChange({ ...value, isFraction: false });
    } else {
      onChange({ ...value, numerator: value.numerator.slice(0, -1) });
    }
  }

  return (
    <div role="group" aria-label={label} className="w-full max-w-xs">
      <EntryDisplay value={value} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <PadButton key={digit} onClick={() => pressDigit(digit)}>
            {digit}
          </PadButton>
        ))}
        {allowNegative ? (
          <PadButton onClick={() => onChange({ ...value, negative: !value.negative })} pressed={value.negative} aria-label="Toggle negative">
            +/&minus;
          </PadButton>
        ) : (
          <span aria-hidden="true" />
        )}
        <PadButton onClick={() => pressDigit("0")}>0</PadButton>
        <PadButton onClick={pressBackspace} aria-label="Backspace">
          ⌫
        </PadButton>
      </div>
      {(allowFraction || allowVariable) && (
        <div className="mt-2 flex gap-2">
          {allowFraction && (
            <PadButton
              wide
              pressed={value.isFraction}
              onClick={() => onChange({ ...value, isFraction: !value.isFraction })}
            >
              Fraction ( / )
            </PadButton>
          )}
          {allowVariable && (
            <PadButton wide pressed={value.variable} onClick={() => onChange({ ...value, variable: !value.variable })}>
              x
            </PadButton>
          )}
        </div>
      )}
    </div>
  );
}

function EntryDisplay({ value }: { value: NumericEntryValue }) {
  const text = value.isFraction
    ? `${value.negative ? "−" : ""}${value.numerator || "–"}/${value.denominator || "–"}`
    : `${value.negative ? "−" : ""}${value.numerator || "–"}${value.variable ? "x" : ""}`;
  return (
    <output
      aria-live="polite"
      className="flex min-h-12 w-full items-center justify-center rounded-control border border-border-strong bg-surface-sunken font-math text-2xl tabular-nums text-ink"
    >
      {text}
    </output>
  );
}

function PadButton({
  children,
  onClick,
  pressed = false,
  wide = false,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
  wide?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed ? true : undefined}
      aria-label={ariaLabel}
      className={`min-h-11 min-w-11 rounded-control border text-base font-medium tabular-nums transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.98] ${
        wide ? "flex-1" : ""
      } ${
        pressed
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-border bg-surface-raised text-ink hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}
