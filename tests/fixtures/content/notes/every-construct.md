---
title: Every construct
tags: [sample]
---

An invented note that holds one of everything normalized markdown can carry, so the screenshot shows how each is drawn. It links to [a note still waiting to be written](/notes/a-seedling/) and to [one that is](/notes/sample-note/), and to [a heading below](#totální-uspořádání-a--b).

## Callouts

> [!note]
> A note without a title is titled by its type.

> [!important] Mind the *gap*
> An important callout, with a title of its own.

> [!tip] A tip
> Tips sprout here.

> [!warning]- Folded until opened
> A warning that stays closed until it is opened.
>
> It holds two paragraphs and some math, $e^{i\pi} + 1 = 0$.

> [!example] A type the site doesn't know
> It is drawn as a note.

> A plain quotation, which is no callout.

## Totální uspořádání (A & B)

Inline math sits in the line, like $a^2 + b^2 = c^2$, and display math stands on its own:

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

### Code

```python
def grow(seed: str, height: int = 3) -> list[str]:
    """Grows a sample sprout."""
    return [seed * i for i in range(height)]  # one row each
```

```rust
fn main() {
    let leaves = 42;
    println!("{} leaves", leaves);
}
```

```whyml
an unknown language, which stays plain
```

Inline `code` reads in Plex.

### An image

![A small invented picture](/assets/img/sample-image.png)

### A wide table

| Specimen | Head | Petals | Stem | Leaves | Where it grows | What it needs | Flowering month | Height in centimetres | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Invented one | round | five | straight | paired | along the river bank | sun and water | May | 40 | the first sample |
| Invented two | star | eight | bent | single | under the canopy | shade | September | 120 | a second, longer sample row |

### Tasks

- [x] Plant the seeds
- [ ] Water the garden

A sentence with a footnote[^first] and another[^second].

[^first]: The first footnote.
[^second]: The second footnote, a little longer.
