---
layout: note
title: "ABA problém"
---

Tento problém je kritickou chybou, která může nastat u [lock-free struktur](/notes/lock-free-struktura.html) využívajících [CAS](/notes/cas.html).

## Vysvětlení problému
Nastává, když je uzel recyklován (uvolněn a znovu alokován na stejné adrese). CAS kontroluje pouze **hodnotu** (adresu), ne **identitu** objektu.

## Příklad [lock-free stack](/notes/lock-free-stack.html)

1. Proces 1 chce udělat POP. Přečte hlavu A a následníka B. (Chystá se udělat A→B).
2. Proces 1 je pozastaven.
3. Proces 2 provede: POP(A), POP(B), a pak PUSH(A).
4. Zásobník má nyní na vrcholu opět A, ale pod ním už není B (může tam být nic nebo něco jiného).
5. Proces 1 se probudí. Jeho `CAS(head, A, B)` uspěje, protože `head` je roven A.
6. **Chyba:** Zásobník má nyní hlavu B, ale B už bylo dříve odebráno a nemělo by tam být .

## Řešení
**Použití [LLSC](/notes/llsc.html):** `SC` selže, pokud došlo k jakémukoliv zápisu, i když je hodnota stejná.
**Verzování ukazatelů (Wide CAS):** K ukazateli přidáme číslo verze. Při každé změně ukazatele se verze inkrementuje. Používá se instrukce pracující s dvojnásobnou šířkou slova (WCAS), která kontroluje dvojici (ukazatel, verze) .
