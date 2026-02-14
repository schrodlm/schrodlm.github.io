---
layout: note
title: "IO model"
---

Tento model abstrahuje počítač na dvě úrovně paměti:
1. **externí paměť** - neomezeně velká, ale extrémně pomalá
2. **interní paměť** - velice malá, ale extrémně rychlá

CPU může pracovat pouze s daty, které jsou v interní paměti. Pokud data v interní paměti nejsou, musejí se tam z externí paměti přenést, jinak je CPU nemůže využívat. Přenášení probíhá o blocích velikosti $B$.

### Co I/O model měří
Hlavní jednotkou měření je počet přenesených bloků (tedy počet přístupů do disku). V tomto modelu úplně ignorujeme čas CPU - počítání je zadarmo. 

### Parametry I/O modelu
- $N$ - velikost vstupu (počet prvků, které chceme zpracovat)
- $B$ - velikost bloku cache 
- $M$ - celková velikost cache

Celkem cache obsahuje $\frac{M}{B}$ cache bloků.

### Modely cache
Je důležité si uvědomit,že tento model nemusí být nutně používán jako 
- externí paměť = RAM
- interní paměť = L1 cache

Může být použit i např. jako
- externí paměť = disk
- interní paměť = RAM

Velký rozdíl je, že u analýzy cache modelů jsou blokové přesuny řízeny cache driverem a ne programem samotným. V naší analýze pracujeme s předpokladem, že tento cache controller pracuje v naprosto optimálně - tedy rozhoduje se tak, že I/O bude minimální. To by ale v reálném světě musel znát budoucnost.

Je ale možné si ukázat, že se můžeme k optimální strategii přiblížit a být jen konstantně pomalejší. (#Věta o kompetetivnosti LRU)

Pracujeme se dvěma cache modely:
- **[cache-aware model](/notes/cache-aware-model/)**
- **cache-oblivious model**

### Cache-aware model
V tomto modelu algoritmus zná parametry cache. Tedy $B$ (velikost bloku), $M$ (velikost cache)
- jednoduší na implementaci algoritmu a analýzu

### Cache-oblivious model
V tomto modelu algoritmus nezná parametry cache. Znamená to, že algoritmus se musí umět přizpůsobit různým parametrům.
- obecně užitečnější než cache-aware model
- cache-oblivious algoritmus (díky rekurzi) "pasuje" do L1, L2, L3 i RAM → Disk zároveň, aniž bychom museli cokoliv měnit.

---
## Věta o kompetetivnosti LRU
[věta o kompetetivnosti LRU](/notes/veta-o-kompetetivnosti-lru/)

---
## Transpozice čtvercové matice 
- Jsou zde na příkladu popsány rozdíly a analýza cache-aware a cache-oblivious přístupů
[transpozice čtvercové matice](/notes/transpozice-ctvercove-matice/)


