import type { HastNode } from 'satteri';

// A few words for building and reading the HTML tree the markdown plugins work on.

export type Element = Extract<HastNode, { type: 'element' }>;
export type Child = Element['children'][number];

export function h(tagName: string, properties: Element['properties'] = {}, children: Child[] = []): Element {
  return { type: 'element', tagName, properties, children };
}

export function text(value: string): Child {
  return { type: 'text', value };
}

export function hasClass(node: Element, name: string): boolean {
  const classes = node.properties['className'];
  return Array.isArray(classes) && classes.includes(name);
}

/** The element children of a node, skipping the whitespace between them. */
export function elements(node: Element): Element[] {
  return node.children.filter((child): child is Element => child.type === 'element');
}
