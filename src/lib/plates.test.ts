import { describe, expect, test } from 'vitest';
import { projectPlate, projectsWithPlates, universityPlate, universitiesWithPlates } from './plates';

const SIZES = { card: [114, 64], wide: [237, 92], narrow: [114, 84] } as const;

describe('project plates', () => {
  test('every project with a plate has it at every size', () => {
    for (const slug of projectsWithPlates)
      for (const [size, [w, h]] of Object.entries(SIZES)) {
        const { image } = projectPlate(slug, size as keyof typeof SIZES);
        expect(image.src).toContain(`${slug}.${size}`);
        expect([image.width, image.height]).toEqual([w, h]);
      }
  });

  test('a project is matched to its plate by slug', () => {
    expect(projectPlate('rentczecher', 'card').alt).toMatch(/^A woodcut of a row of Prague houses/);
  });

  test('clascii keeps its plate under its old name, ascii-art-generator', () => {
    for (const size of ['card', 'wide', 'narrow'] as const)
      expect(projectPlate('ascii-art-generator', size)).toEqual(projectPlate('clascii', size));
    expect(projectPlate('clascii', 'card').alt).not.toEqual(projectPlate('neutral', 'card').alt);
  });

  test('a project without a plate of its own gets the neutral plate', () => {
    expect(projectPlate('a-project-without-a-plate', 'wide')).toEqual(projectPlate('neutral', 'wide'));
  });

  test('a slug that is a property of every object still gets the neutral plate', () => {
    expect(projectPlate('constructor', 'card')).toEqual(projectPlate('neutral', 'card'));
  });
});

test('every drawn plate belongs to a project or university the site describes', () => {
  const drawn = Object.keys(import.meta.glob('../assets/plates/*/*.png')).map((f) => f.split('/').at(-1)!.split('.')[0]);
  expect(new Set(drawn)).toEqual(new Set([...projectsWithPlates, 'neutral', ...universitiesWithPlates]));
});

describe('university plates', () => {
  test('FIT and MFF have their buildings, wide and narrow', () => {
    expect(universitiesWithPlates).toEqual(['fit-cvut', 'mff']);
    for (const slug of universitiesWithPlates) {
      expect(universityPlate(slug, 'wide').image.width).toBe(237);
      expect(universityPlate(slug, 'narrow').image.width).toBe(114);
      expect(universityPlate(slug, 'wide').alt).not.toEqual(universityPlate('somewhere-else', 'wide').alt);
    }
  });

  test('a university without a plate gets the neutral plate', () => {
    expect(universityPlate('somewhere-else', 'narrow')).toEqual(projectPlate('neutral', 'narrow'));
  });
});
