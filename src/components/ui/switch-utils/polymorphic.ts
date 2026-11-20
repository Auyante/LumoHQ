/**
 * Helpers for state-aware components (missing from the prompt; written to match its imports).
 * `className` may be a string or a function of the component state, like Base UI / React Aria.
 */
export type ClassNameValue<State> = string | ((state: State) => string | undefined) | undefined;

export function resolveClassName<State>(className: ClassNameValue<State>, state: State): string | undefined {
  return typeof className === "function" ? className(state) : className;
}

/** `data-*` boolean attribute: present ("") when true, absent when false. */
export function dataAttr(condition: boolean | undefined): "" | undefined {
  return condition ? "" : undefined;
}
