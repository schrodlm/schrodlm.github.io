---
layout: note
title: "vztah mezi komunikačními modely a konzistencí v distribuovaných systémech"
---

Komunikační modely a konzistence spolu úzce souvisí - **způsob, jakým si komponenty distribuovaného systému vyměňují zprávy, přímo ovlivňuje, jaké záruky konzistence můžete poskytovat**.

## Základní princip
Konzistence je o tom, **jaký pohled na data mají různé části systému**. Komunikační model určuje, **jak rychle a v jakém pořadí se informace o změnách šíří**. Tento princip popisuje [CAP theorem](/notes/cap-theorem.html) a úzce s tímto tématem souvisí.

---
## Konkrétní souvislosti
**Synchronní komunikace → [Silnější konzistence](/notes/konzistence-distribuovaneho-systemu.html#silná-konzistence-strong-consistency)**
- Když klient čeká na potvrzení od všech replik, můžete garantovat [linearizabilitu](/notes/modely-konzistence-distribuovaneho-systemu.html#linearizability-linearizovatelnost--atomická)
- Máte jistotu, že operace jsou aplikovány v konzistentním pořadí
- Ale platíte za to vyšší latencí a nižší dostupností

**[Asynchronní komunikace](/notes/komunikace-v-distribuovanych-systemech.html#asynchronní-komunikace-non-blocking) → [Slabší konzistence](/notes/konzistence-distribuovaneho-systemu.html#slabá-konzistence-weak-consistency)**
- Zprávy přichází v různém pořadí, mohou se zpozdit nebo ztratit
- Různé repliky mohou mít dočasně odlišný pohled na data
- Typicky vedou k eventual consistency nebo kauzální konzistenci
- Výhodou je nižší latence a vyšší dostupnost