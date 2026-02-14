---
layout: note
title: "detekce globálního stavu"
---

V distribuovaném systému je stav rozprostřen a neustále se mění vlivem asynchronní komunikace. Detekce globálního stavu (často realizovaná jako **Snapshot**) slouží k:

**Checkpointing a Recovery (Zotavení)**: 
- Pravidelné ukládání konzistentního stavu celého systému na disk. Pokud dojde k havárii (Crash Failure), systém se může restartovat z posledního uloženého snapshotu, místo aby začínal od nuly.

**[detekce uváznutí](/notes/deadlock-v-distribuovanem-systemu/) (deadlock detection)**:
- Zjištění, zda se systém nedostal do cyklického čekání na prostředky, které nikdo neuvolní.

**[Detekce terminace](/notes/detekce-terminace-v-distribuovanem-systemu/) (termination detection)**
- Zjištění, zda již všechny uzly dokončily svou práci a v komunikačních kanálech nejsou žádné zprávy, které by mohly vyvolat další aktivitu.

**Distribuované ladění (Debugging)**:
- Sledování historie změn stavu napříč uzly pro nalezení chyb, které se projevují jen při určitém souběhu událostí.

**Garbage Collection**:
- Identifikace objektů, na které již neexistuje odkaz nikde v celém distribuovaném systému, aby mohla být uvolněna paměť.

---
## [vztah konsenzu a detekce globálního stavu](/notes/vztah-konsenzu-a-detekce-globalniho-stavu/)

---
## Algoritmy pro detekci globálního stavu
[Chandy-Lamport](/notes/chandy-lamport/)