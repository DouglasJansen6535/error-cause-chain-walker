import { test } from 'node:test';
import assert from 'node:assert/strict';

import { walkErrorCauseChain } from '../src/core.js';

test('returns an empty array for a non-error input', () => {
  assert.deepEqual(walkErrorCauseChain(null), []);
  assert.deepEqual(walkErrorCauseChain(undefined), []);
  assert.deepEqual(walkErrorCauseChain('error'), []);
  assert.deepEqual(walkErrorCauseChain(42), []);
});

test('returns a single entry for an error with no cause', () => {
  const error = new Error('plain');
  const result = walkErrorCauseChain(error);

  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Error');
  assert.equal(result[0].message, 'plain');
  assert.equal(result[0].stack, error.stack);
});

test('returns a single entry for an error with a null cause', () => {
  const error = new Error('null cause', { cause: null });
  const result = walkErrorCauseChain(error);

  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Error');
  assert.equal(result[0].message, 'null cause');
});

test('walks a simple two-error cause chain', () => {
  const cause = new TypeError('inner');
  const outer = new Error('outer', { cause });
  const result = walkErrorCauseChain(outer);

  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Error');
  assert.equal(result[0].message, 'outer');
  assert.equal(result[1].name, 'TypeError');
  assert.equal(result[1].message, 'inner');
});

test('preserves stack strings when available', () => {
  const cause = new RangeError('bad range');
  const outer = new Error('wrapping', { cause });
  const result = walkErrorCauseChain(outer);

  assert.equal(result[0].stack, outer.stack);
  assert.equal(result[1].stack, cause.stack);
});

test('omits stack when it is missing', () => {
  const error = new Error('no stack');
  // Simulate an environment where stack is not present.
  Object.defineProperty(error, 'stack', { value: undefined });

  const result = walkErrorCauseChain(error);
  assert.equal('stack' in result[0], false);
});

test('walks a three-level chain with mixed error types', () => {
  const root = new SyntaxError('syntax');
  const middle = new TypeError('type', { cause: root });
  const top = new Error('top', { cause: middle });

  const result = walkErrorCauseChain(top);

  assert.equal(result.length, 3);
  assert.equal(result[0].name, 'Error');
  assert.equal(result[0].message, 'top');
  assert.equal(result[1].name, 'TypeError');
  assert.equal(result[1].message, 'type');
  assert.equal(result[2].name, 'SyntaxError');
  assert.equal(result[2].message, 'syntax');
});

test('stops at a non-error cause value', () => {
  const error = new Error('outer');
  error.cause = 'not an error';

  const result = walkErrorCauseChain(error);

  assert.equal(result.length, 1);
  assert.equal(result[0].message, 'outer');
});

test('handles a cyclic cause chain without infinite loop', () => {
  const errorA = new Error('A');
  const errorB = new Error('B', { cause: errorA });
  errorA.cause = errorB;

  const result = walkErrorCauseChain(errorA);

  assert.equal(result.length, 2);
  assert.equal(result[0].message, 'A');
  assert.equal(result[1].message, 'B');
});

test('does not mutate the original error or its causes', () => {
  const cause = new Error('inner');
  const outer = new Error('outer', { cause });
  const outerStackBefore = outer.stack;
  const causeStackBefore = cause.stack;

  walkErrorCauseChain(outer);

  assert.equal(outer.cause, cause);
  assert.equal(outer.stack, outerStackBefore);
  assert.equal(cause.stack, causeStackBefore);
});
