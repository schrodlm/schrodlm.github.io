---
layout: note
title: "splay"
---

Operation used by [splay tree](/notes/splay-tree/) data structure

`splay` algoritmus, je součástí všech operací (`find`, `insert`, `delete`) [splay stromu](/notes/splay-tree/). Splay je implementován pomocí tří rotačních, které mění strukturu stromu.

Tyto rotační operace se nazývají **zig**, **zig-zag**, **zig-zig** a všechny mají složitost $O(1)$

>Obecně splay tree vždy preferuje dvojité rotace, protože tyto operace zajišťují mírné zlepšení stavu zbytku stromu (a zajišťují amortizovanou složitost), jednoduchá rotace pouze pouze "zrcadlí strom"

Pro následující definici operací zavedu prvky:
- $x$ - prvek, který splayujeme (snažíme se ho probublat nahoru)
- $p$ - rodič $x$
- $g$ - prarodič $x$
### Zig
**Podmínky použití**
- Vždy se používá pouze u kořene stromu

**Ukázka**
![Image](/assets/img/Pasted image 20251008201252.png)
**Dopad na výšku stromu**
- Tato operace sama o sobě výšku stromu příliš nemění, pouze lokálně prohodí dva uzly. Je to jen "dokončovací" krok.
---
### Zig-zig
Dvojitá rotace, která mění výšku stromu. Zig-zig je důležitý pro zkracování dlouhých cest. Mění dlouhé lineární větve na širší strom. Pokud splayujeme nejhlubší prvek v lineárním seznamu, výsledný strom bude mít zhruba poloviční hloubku. (k vyzkoušení tady: https://www.cs.usfca.edu/~galles/visualization/SplayTree.html)

Tedy co jsem pochopil je, že zig-zig **globálně opravuje** degenerované stromy a matematicky „vydělává“ potenciál, abychom měli operace levné.

**Podmínky použití**
Používá se když pro oba prvky $x$ a $p$ platí jedno z těchto tvrzení:
- jsou oba levé děti
- jsou oba pravé děti

**Ukázka**
![Image](/assets/img/Pasted image 20251008202505.png)

**Dopad na výšku stromu**
- Tento krok "narovnává" dlouhé lineární řetězce.
- Pokud máme dlouhou "vyhublou" větev (např. samí leví synové), série Zig-Zig operací ji "rozbije" a změní na mnohem širší a nižší strom. Přibližuje hloubku uzlů polovině původní hloubky 
---
### Zig-zag
Dvojitá rotace, která nezlepšuje strukturu stromu tak drasticky jako zig-zig, ale pomáhá lokální vyvažování takovým způsobem, aby pak zig-zig mohl fungovat dobře

**Podmínky použití**
Používá se, když pro oba prvky $x$ a $p$ platí:
- jeden je levé dítě a druhý pravé

**Ukázka**
![Image](/assets/img/Pasted image 20251008202601.png)

**Dopad na výšku stromu**
Podstromy se efektivněji sbalí k sobě. Stejně jako zig-zig pomáhá snižovat celkovou výšku stromu tím, že "vytahuje" hluboké uzly nahoru a rozděluje původní větve.