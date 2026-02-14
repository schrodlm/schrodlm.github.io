---
layout: note
title: "lisp machine"
---

Články:
[The lost cause of lisp machines](https://www.tfeb.org/fragments/2025/11/18/the-lost-cause-of-the-lisp-machines/)

---
Je to klasický příklad tkzv: high-level language computer architecture

Lisp machine byl general-purpose počítač navržený tak, aby na něm běžel Lisp efektivně a byl využíván jako "hlavní" programovací jazyk.

Celá architektura stroje byla navržena tak, aby přímo podporovala vlastnosti Lispu, tedy v té době převratné vlastnosti jako:
- dynamické typování
- garbage collection
- flexibilní struktury dat

Navíc byl Lisp jako takový velmi velký a v té době náročný na provoz.


## Hardwarová architektura
Architektura lisp machine se hodně lišila od typické počítačové architektury, na které jsem zvyklý, jako je CISC nebo RISC. Měla specializované hardwarové prvky a využívala takzvanou [tagged architecture](/notes/tagged-architecture/).

Ta umožňovala hardwarovou kontrolu typům tedy procesor lisp machine byl schopný interpretovat tagy přímo v rámci jediné instrukce.


## Zánik
Lisp machines měli plno problémů, které vedli k selhání:

1. Lisp Machines byly od začátku **velmi drahé a exkluzivní** řešení.
2. Počítače s RISC procesory (např. **Sun Microsystems, HP, DEC**) se staly neuvěřitelně rychlé. Standardní 32- a 64bitové procesory, podporované obrovskými investicemi do masové výroby, dosáhly takového výkonu, že dokázaly spouštět Lispové implementace (jako **Common Lisp**) na standardním hardwaru **stejně rychle nebo rychleji a mnohem levněji** než specializované Lisp Machines.
3. **Pokrok v Kompilátorech:** Zdokonalení JIT-compiler (Just-In-Time) a AOT-compiler (Ahead-of-Time) kompilátorů dokázalo efektivně implementovat kontrolu typů a GC i na konvenčním hardwaru, čímž eliminovalo hlavní výhodu taggované architektury.

