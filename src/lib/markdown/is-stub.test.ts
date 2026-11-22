import { describe, expect, it } from 'vitest';
import { isStub } from './is-stub';

describe('isStub', () => {
  it.each([
    ['---\ntitle: A\n---\n', true],
    ['---\ntitle: A\n---', true],
    ['---\ntitle: A\n---\n\n  \n', true],
    ['---\r\ntitle: A\r\n---\r\n', true],
    ['\uFEFF---\ntitle: A\n---\n', true],
    ['---\ntitle: A\n---\nA body.\n', false],
    ['---\ntitle: A\n---\n---\n', false],
  ])('%j is a stub: %s', (markdown, stub) => {
    expect(isStub(markdown)).toBe(stub);
  });
});
