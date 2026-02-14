---
layout: note
title: "Vzdalene Spousteni Procesu A Migrace"
---

Jak zařídit, aby kód běžel v distribuovaném systému tam, kde je to nejvýhodnější.

## Motivace
- **Vyvažování zátěže (load balancing):** Uzel A nestíhá, uzel B se nudí.

- **Optimalizace I/O:** Proces hodně komunikuje s diskem nebo jiným procesem, který je na uzlu B – tak ho k němu „přistěhujeme“.

- **Správa hardwaru:** Potřebujeme uzel A vypnout kvůli údržbě, tak z něj práci „odsuneme“ jinam.

## Hlavní cíl: Transparentnost
Proces o stěhování **nesmí vědět**. Musí mít pocit, že pořád běží na stejném místě. To znamená:
- Jeho komunikační vazby na ostatní procesy musí zůstat zachovány.
- Zprávy, které mu lidé posílají na starou adresu, musí být přesměrovány (forwarding).

## Jak se proces technicky stěhuje?
Je to podobné, jako když „uspíš“ počítač a pak ho probudíš na jiném hardwaru.
1. **Zmražení (Freeze):** Proces se zastaví a dostane se do speciálního stavu „v migraci“.
2. **Přenos stavu:** Musíš přenést registry CPU, zásobník (stack) a deskriptory procesů.
3. **Přenos paměti (VM):** To je nejobjemnější část (obsah RAM)
4. **Restart:** Na cílovém uzlu se proces „odmrazí“ a pokračuje od stejné instrukce, kde přestal.

## Strategie přenosu paměti
Přenos RAM trvá nejdéle. Existují dvě hlavní strategie, jak to udělat:

| **Strategie**                           |                                    **Princip**                                     | **Výhoda / Nevýhoda**                                                                                               |
| --------------------------------------- |:----------------------------------------------------------------------------------:| ------------------------------------------------------------------------------------------------------------------- |
| **Pre-copying** 16                      |    Paměť se kopíruje na pozadí, zatímco proces **stále běží** na starém uzlu17.    | **Výhoda:** Minimální doba „zmražení“ (downtime)18181818.                                                           |
| **Post-copying** (Copy-on-reference) 19 | Nejdřív se přenese jen „mozek“ (registry) a proces se hned spustí na novém uzlu20. | **Nevýhoda:** Pokud proces sáhne do paměti, kterou ještě nemá, nastane _page fault_ a musí se to dotáhnout po síti. |
Co jsou to reziduální dependence?
To je "zbytky", který po sobě proces zanechá na starém uzlu.
**Příklad:** Starý uzel musí dál přeposílat zprávy, které procesu chodí na starou adresu.
**Snaha:** Systémy (jako Charlotte) se snaží reziduální dependence eliminovat, aby starý uzel mohl úplně zapomenout, že u něj kdy proces běžel.