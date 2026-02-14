---
layout: note
title: "Distribuovane Strankovani"
---

**Distribuované stránkování** rozšiřuje koncept virtuální paměti na celou síť. Stránky paměti se dynamicky stěhují tam, kde jsou zrovna potřeba. Je to sice uživatelsky přívětivé, ale extrémně náchylné na síťové zpoždění a tzv. **thrashing** (neustálé stěhování stránek mezi uzly

### Princip
Systém využívá mechanismus virtuální paměti operačního systému:

1. **Page Fault:** Program se pokusí přistoupit k adrese, která není v jeho lokální RAM.
2. **Zásah Middleware:** Místo aby program spadl, middleware zachytí chybu a podívá se do své tabulky, na kterém uzlu v síti se tato „stránka“ nachází.
3. **Přenos po síti:** Middleware pošle zprávu danému uzlu, stránku si vyžádá a nakopíruje ji do lokální paměti tazatele.
4. **Pokračování:** Program pokračuje v běhu, jako by se nic nestalo.

---
### Stavy stránek
Stránka může být v různých režimech:

- **Uncached:** Stránka není u nikoho (je na disku/v centrále)    
- **Shared (Čtení):** Může ji mít víc lidí najednou. Je to v pohodě, protože ji nikdo nemění.
- **Exclusive (Zápis):** Pokud chce někdo do stránky psát, musí být **jediný**, kdo ji má. Knihovník musí všem ostatním jejich kopie „sebrat“ (zneplatnit), aby nevznikla nekonzistence.

### 4. Hlavní problém (thrashing)

To je nejdůležitější pojem k zapamatování. Nastává, když dva uzly chtějí do stejné stránky zapisovat střídavě:
- Uzel A si vyžádá stránku pro zápis.
- O milisekundu později ji chce uzel B.
- Stránka „létá“ po síti tam a zpět jako pingpongový míček.
- **Výsledek:** Systém tráví 99 % času posíláním dat po drátě a 1 % skutečným výpočtem.

