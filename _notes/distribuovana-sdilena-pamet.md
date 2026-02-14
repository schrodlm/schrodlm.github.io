---
layout: note
title: "distribuovaná sdílená paměť"
---

**Distribuovaná sdílená paměť** je softwarová vrstva (middleware), která umožňuje procesům na různých uzlech přistupovat k datům tak, jako by byly v jedné společné RAM, přestože ve skutečnosti probíhá pod kapotou posílání zpráv (message passing).

## Pravidla
Zde opět [modely konzistence distribuovaného systému](/notes/modely-konzistence-distribuovaneho-systemu/) definují pravidla, jak se změny v paměti propagují. Čím silnější model, tím jednodušší programování, ale pomalejší systém.

### Silné modely (Strong Consistency)
- **Linearizovatelnost**: Operace jsou viditelné okamžitě v reálném čase. Nejpřísnější, ale nejpomalejší model.
- **Sekvenční konzistence**: Všichni vidí stejné pořadí operací, i když se projeví se zpožděním. Standard pro replikované databáze.

### Slabé modely (Weak Consistency)**:
- **Kauzální konzistence**: Garantuje pořadí jen u operací, které spolu souvisí (příčina → následek).
- **Případná konzistence (Eventual)**: Repliky se shodnou až po nějaké době, kdy ustanou zápisy. Nejrychlejší a nejdostupnější model.

---
## Implementace
[distribuované stránkování](/notes/distribuovane-strankovani/)