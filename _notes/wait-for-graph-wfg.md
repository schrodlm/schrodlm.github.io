---
layout: note
title: "Wait-For-Graph (WFG)"
---

**Wait-For-Graph (WFG)** je v podstatě „mapa závislostí“. V distribuovaném systému je to nejpoužívanější způsob, jak zjistit, jestli je systém v  deadlocku.

>[!note] TL;DR
> - **Nástroj:** Detekce distribuovaného deadlocku.
> - **Princip:** Hledání cyklů v grafu závislostí procesů.
> - **V distribuovaném prostředí:** Používá se „Edge-Chasing“ (posílání sond po hranách grafu). Pokud se sonda vrátí k odesílateli, existuje cyklus = deadlock.
> - **Riziko:** „Falešný deadlock“ kvůli zpoždění zpráv (nutnost konzistentního snapshotu ([Chandy-Lamport](/notes/chandy-lamport.html))).
---

>[!note] Ještě TL;DR pro zkoušku
> - **Deadlock** = cyklus v WFG.
> - **Phantom Deadlock** = falešná detekce kvůli zpoždění zpráv (nekonzistentní řez).
> - **Edge-chasing** = posílání sond po hranách, návrat k odesílateli = potvrzení cyklu.
> - **Termination** = procesy jsou pasivní A v kanálech nejsou zprávy.

---
## Co je to WFG? (Princip)
WFG je orientovaný graf, kde:
- **Vrcholy (Uzly):** Jsou jednotlivé procesy (P1​,P2​,...).
**Hrany:**
- $P→R$: Proces žádá o prostředek.
- $R\to P$: Proces drží prostředek.
- $P_1​→P_2$​: Proces $P_1$​ je blokován procesem $P_2$​.

> **Základní pravidlo:** Pokud se v tomto grafu objeví **uzavřený cyklus** (např. $P_1​→P_2​→P_3​→P_1$​), nastal **deadlock**.

---