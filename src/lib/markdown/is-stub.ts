// Whether a page is a stub, worked out from its markdown alone. It is kept apart from the stub
// links' plugin, which reads the notes folder with Node, so the browser can import it too.

const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

/** Whether a note's markdown has nothing below its front matter. */
export function isStub(markdown: string): boolean {
  return markdown.replace(/^\uFEFF/, '').replace(FRONT_MATTER, '').trim() === '';
}
