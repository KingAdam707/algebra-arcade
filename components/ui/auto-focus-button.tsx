"use client";

import { useEffect, useRef } from "react";

/**
 * A button that focuses itself when it mounts. Used for the primary action in
 * each practice phase transition, so keyboard/screen-reader focus follows the
 * flow instead of silently resetting to <body> when the previous control
 * (e.g. the RULE builder's Apply button) unmounts.
 */
export function AutoFocusButton(props: React.ComponentProps<"button">) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return <button ref={ref} {...props} />;
}
