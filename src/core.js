/**
 * Walks the `cause` chain of an error, collecting each error's name,
 * message, and stack into an ordered array.
 *
 * The walk starts at the provided error and continues as long as the
 * current error has a truthy `cause` property. ES2022 specifies `cause`
 * as an optional property on Error instances, so the loop is guarded
 * against missing or non-error causes.
 *
 * @param {unknown} error - The error to start from. Non-error values are
 *   treated as an empty chain.
 * @returns {Array<{name: string, message: string, stack?: string}>}
 *   Ordered from outermost error to innermost cause.
 */
export function walkErrorCauseChain(error) {
  const chain = [];
  let current = error;

  // The loop terminates when `current` is not an object with a `cause`
  // property, or when a cycle is detected. The cycle guard is necessary
  // because JavaScript does not prevent an Error's cause from pointing
  // back to an earlier error in the chain.
  const seen = new Set();

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);

    const entry = {
      name: current.name,
      message: current.message,
    };

    // `stack` is non-standard before ES2022 but is universally available
    // in Node.js and modern browsers. It is included only when present so
    // the return type stays honest.
    if (typeof current.stack === 'string') {
      entry.stack = current.stack;
    }

    chain.push(entry);

    current = current.cause;
  }

  return chain;
}
