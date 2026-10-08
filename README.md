# Error Cause Chain Walker

A tiny JavaScript library that follows the ES2022 `cause` property on nested errors, collecting each error's name, message, and stack into an ordered array for reporting.

## Usage

```js
import { walkErrorCauseChain } from 'error-cause-chain-walker';

const root = new TypeError('Invalid input');
const middle = new Error('Validation failed', { cause: root });
const top = new Error('Request failed', { cause: middle });

const chain = walkErrorCauseChain(top);
console.log(chain);
// [
//   { name: 'Error', message: 'Request failed', stack: '...' },
//   { name: 'Error', message: 'Validation failed', stack: '...' },
//   { name: 'TypeError', message: 'Invalid input', stack: '...' }
// ]
```

## Why this exists

When errors are wrapped with `new Error(message, { cause })`, the original error is hidden one level down. Logging a top-level error only shows the outermost message unless you manually traverse `cause`. This library does that traversal once and returns a flat, ordered array that is easy to serialize or display.

The trade-off is that the walk stops at the first non-Error `cause`. ES2022 allows `cause` to be any value, but this library focuses on chains of actual `Error` instances because that is the common reporting case. A string or plain object as a cause is not an error chain, so it is ignored.

## Edge cases

- A `cause` that is not an `Error` terminates the walk immediately.
- Cyclic cause chains are detected and do not cause an infinite loop.
- If an error's `stack` is missing or not a string, that entry omits the `stack` property entirely.
- Passing a non-error value returns an empty array.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

