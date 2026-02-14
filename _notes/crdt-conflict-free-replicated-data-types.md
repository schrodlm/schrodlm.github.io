---
layout: note
title: "CRDT (conflict-free replicated data types)"
---

CRDT jsou speciální datové typy (např. počítadla, množiny, seznamy), které jsou navrženy tak, aby mohly být replikovány na více uzlech, kde každý uzel může provádět zápisy **nezávisle a bez koordinace**.

### Proč existují? (Problém s [konsenzem](/notes/konsenzus-v-distribuovanych-systemech.html))

- **Klasický konsenzus:** Vyžaduje, aby se uzly na každé změně dohodly (výměna zpráv, lídr, kvórum). To je pomalé a nefunguje to, když je síť rozdělená (_network partition_).
    
- **CRDT přístup:** Uzly prostě zapisují lokálně. Když se později spojí, jejich stavy se **slijí (merge)** dohromady. Matematika CRDT zaručuje, že výsledek bude na všech uzlech identický, aniž by musel někdo rozhodovat, kdo měl pravdu.
![Image](/assets/img/Pasted image 20260119084455.png)

### Jak to funguje? (Matematická magie)
Aby se stavy mohly bezpečně sloučit, musí operace (nebo merge funkce) splňovat tři základní vlastnosti:

1. **Komutativita:** Nezáleží na pořadí, v jakém aktualizace dorazí (A+B=B+A).
2. **Asociativita:** Nezáleží na tom, jak aktualizace seskupíme ((A+B)+C=A+(B+C)).
3. **Idempotence:** Opakované doručení stejné zprávy nezmění výsledek (A+A=A).

### Dvě hlavní varianty
- **State-based (CvRDT):** Uzly si posílají svůj **celý stav**. Přijímající uzel použije funkci `merge()`, která spojí lokální a vzdálený stav.

- **Operation-based (CmRDT):** Uzly si posílají jen **operace** (např. "přidej 5"). Vyžaduje to ale spolehlivější doručovací protokoly (kauzální doručení), aby se operace neztratily.
---
### Praktické příklady

- **Distribuované počítadlo (G-Counter):** Každý uzel má v poli svou buňku, kterou inkrementuje. Celková hodnota je součet všech buněk. Merge dvou polí je prosté vzetí maxima pro každou buňku.
    
- **Nákupní košík:** Místo "přemaž košík" se používá operace "přidej ID produktu do množiny". I když dva lidé přidají věci zároveň, výsledkem po spojení bude sjednocení obou množin.
    
- **Kolaborativní editace (Google Docs):** CRDT umožňují více lidem psát do jednoho dokumentu zároveň, aniž by se jim text "přemazával" nebo vznikaly konflikty, které musí řešit člověk.