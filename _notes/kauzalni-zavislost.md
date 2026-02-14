---
tags:
  - distributed_system
language: czech
title: "kauzální závislost"
---
**Kauzální závislost** je fundamentální princip, který dává událostem v distribuovaném systému logický řád.
- **[Logické hodiny](/notes/logicky-cas.html)** jsou nástrojem k jejímu **měření**.
- **Kauzální doručování (Causal Delivery)** je mechanismus, který ji **vynucuje** v síti.
- **Kauzální konzistence** je záruka, kterou díky tomu dostane **uživatel**.

---
V reálném světě je to vztah **Příčina → Následek**.

- _Příklad:_ Výstřel (příčina) → Díra v terči (následek).    
- Nikdy se nemůže stát, že by se nejprve objevila díra a až pak zazněl výstřel.


Událost $B$ je **kauzálně závislá** na události $A$ (zapisujeme $A\toB$), pokud:
1. **Lokální historie:** $A$ i $B$ jsou v jednom procesu a $A$ proběhla dříve.
2. **Přenos zprávy:** $A$ je odeslání zprávy a $B$ je její přijetí.
3. **Tranzitivita:** $A$ způsobilo $X$ a $X$ způsobilo $B$. (Tedy $A$ nepřímo způsobilo $B$).

> **Pokud A→B, pak B "ví" o A a mohlo být ovlivněno výsledkem A.**

