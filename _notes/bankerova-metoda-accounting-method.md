---
layout: note
title: "bankéřova metoda (accounting method)"
---

Jedná se způsob jak dokázat [amortizovanou složitost](/notes/amortized-complexity/) datových struktur

 Je založena na principu **předplácení**.
- **Analogie:** Prasátko na peníze.
- **Princip:** Kdykoli děláme levnou operaci, naúčtujeme si za ni "fiktivní poplatek" navíc. Tento přebytek (kredit) uložíme **k danému prvku** v datové struktuře.
- **Drahá operace:** Když přijde drahá operace, "vybereme prasátko". Použijeme nastřádané kredity z jednotlivých prvků, abychom operaci zaplatili.
- **Podmínka:** Nikdy se nesmíme dostat do mínusu. Součet kreditů musí být vždy nezáporný.


- **Výhoda:** Velmi intuitivní, dobře se představuje.    
- **Nevýhoda:** Musíme vymyslet, _kam_ a _kolik_ mincí přesně položit. U složitých stromů to může být zmatečné.
- 