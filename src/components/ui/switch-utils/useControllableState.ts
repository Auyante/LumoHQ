"use client";
import { useCallback, useRef, useState } from "react";

/**
 * Controlled when `value` is defined, uncontrolled otherwise (missing from the prompt; written to match).
 * `onChange` fires on every user change in both modes.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
}): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : inner;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      if (!Object.is(next, current)) onChangeRef.current?.(next);
    },
    [isControlled, current],
  );
  return [current, set];
}
