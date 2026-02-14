---
layout: note
title: "Vztah Konsenzu A Detekce Globalniho Stavu"
---

Souvislost těchto dvou problémů je v samotné povaze obou problémů. 

Detekce globálního stavu je snaha o **pozorování** reality (co se stalo). Konsenzus je snaha o **dohodu** na realitě (co se má stát).

**Vzájemná závislost**:
	- Aby mohl proběhnout konsenzus (např. v algoritmu RAFT), systém musí být schopen detekovat selhání (stav uzlu „živý/mrtvý“).
	- Aby byl snapshot (globální stav) užitečný v silně konzistentních systémech, musí se uzly často nejdříve **shodnout (konsenzus)** na tom, kdy přesně se má snímek pořídit, aby odpovídal totálnímu uspořádání událostí.

> [!note] Teoretické limity
>Jelikož detekce globálního stavu čelí stejným problémům jako [konsenzus v distribuovaných systémech](/notes/konsenzus-v-distribuovanych-systemech/) (jen rekonstruuje minulost) zatímco konsenzus se snaží určit budoucnost (shodu na hodnotě) - platí pro detekci globálního stavu stejné teoretické limity