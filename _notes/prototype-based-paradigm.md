---
layout: note
title: "Prototype Based Paradigm"
---

This paradigm tries to get rid of hierarchies created by class-based paradigm, while remaining fundamentally object-oriented.

In a prototype-based system, **there is no distinction between blueprints and instances**—any object can serve as a **prototype** for another object. New objects are created by **cloning** an existing prototype.

## History and current state
It has an old history, with the languages like Self. Nowadays it is not used very much. Only two mainstream languages that employ this paradigm are
- **JavaScript**: The most widely-used prototype-based language. Its later `class` keyword is mostly syntactic sugar over the prototype chain.
- **Lua**: Uses prototypes through metatables and delegation.

## Implications
Not having classes has some interesting implications:

- Objects "inherit" properties and methods via delegation through a prototype chain.
- You can change the behavior of an object in runtime (dynamic extension).
- It is much less rigid (you don't have any _isSubclassOf_ or _isInstanceOf_ relations, only a prototype chain).

## Advantages

- **Simplicity**: One concept (objects) instead of two (classes + instances)
- **Flexibility**: No rigid _isSubclassOf_ or _isInstanceOf_ relations—just prototype chains
- **Rapid prototyping**: Create variations by cloning and tweaking without defining formal hierarchies

## Trade-offs

The flexibility and lack of rigidity becomes a liability at some point:
- **Lack of formal contracts**: No enforced interfaces or type hierarchies make code harder to reason about
- **Ad-hoc modifications**: Runtime changes can create unexpected behaviors and hard-to-trace bugs
- **Documentation burden**: Without class definitions as documentation, understanding object capabilities requires tracing prototype chains
- **Tooling challenges**: IDEs struggle with autocomplete and refactoring when object shapes are fluid

This makes prototype-based languages cool choice for small projects and experimentation, but challenging for large codebases without huge discipline.

## Explore
A pure prototype-based language you can try out is io language