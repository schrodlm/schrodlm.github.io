import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imageFile } from './content-images.ts';

const dir = resolve('/content/assets/img');

describe('imageFile', () => {
  it('finds a content image at the root', () => {
    expect(imageFile('/assets/img/flow.png', '/', dir)).toBe(resolve(dir, 'flow.png'));
  });

  it('finds a content image below the base path', () => {
    expect(imageFile('/site-preview/assets/img/flow.png', '/site-preview/', dir)).toBe(resolve(dir, 'flow.png'));
  });

  it('decodes the name and drops the query', () => {
    expect(imageFile('/assets/img/data%20flow.png?v=1', '/', dir)).toBe(resolve(dir, 'data flow.png'));
  });

  it('ignores every other request', () => {
    expect(imageFile('/notes/flow/', '/', dir)).toBeUndefined();
    expect(imageFile('/assets/flow.png', '/', dir)).toBeUndefined();
    expect(imageFile('/assets/img/', '/', dir)).toBeUndefined();
  });

  it('never leaves the image folder', () => {
    expect(imageFile('/assets/img/../secret.md', '/', dir)).toBeUndefined();
    expect(imageFile('/assets/img/..%2F..%2Fsecret.md', '/', dir)).toBeUndefined();
    expect(imageFile('/assets/img/%E0%A4%A', '/', dir)).toBeUndefined();
  });
});
