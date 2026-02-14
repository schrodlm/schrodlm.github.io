---
layout: note
title: "Maekawa's algorithm"
---

## Princip: Hlasovací množiny
Místo toho, aby si proces $P_i$​ žádal o povolení od _všech_ uzlů v síti, žádá jen o povolení od podmnožiny uzlů, které se říká **hlasovací množina ($V_i$​)**.

Aby byla zajištěna bezpečnost (Safety - max 1 v CS), musí tyto množiny splňovat **průnikovou vlastnost**:

$$V_i​ \cap V_j​ \neq \emptyset (\forall i,j) $$


### Jak sestavit množiny ($\sqrt N \times \sqrt N$ mřížka)

Uspořádáme $N$ uzlů do $\sqrt N \times \sqrt N$ matice.
- Hlasovací množina pro uzel $P_i$ = **všechny uzly v jeho řádku + všechny uzly v jeho sloupci**
- Velikost každé množiny: $2\sqrt N - 1$
- Průnik garantován: dva různé procesy sdílí vždy alespoň jeden společný uzel

#### Průběh algoritmu
⚠️ **Pozor:** Základní verze může deadlockovat. V praxi se používá s timestampy a INQUIRE/YIELD mechanismem.
1. **Request:**
   - Proces Pi chce do CS. Pošle REQUEST(timestamp) všem členům Vi.

2. **Hlasování (Uzel v roli voliče):**
   - Když uzel obdrží REQUEST:
     - Pokud **nemá aktivní VOTE**, pošle VOTE žadateli
     - Pokud **už VOTE dal**, zařadí novou žádost do **fronty** (seřazené podle timestampu)
   - ⚠️ Uzel nemůže dát další VOTE, dokud nedostane RELEASE od současného držitele

3. **Vstup:**
   - Pi vstoupí do CS, až když obdrží VOTE od **všech** členů $V_i$

4. **Release:**
   - Po opuštění CS pošle $P_i$ zprávu RELEASE členům $V_i$
   - $T_i$ uvolní svůj hlas a pošlou VOTE **prvnímu čekajícímu ve frontě**

![Image](/assets/img/Pasted image 20260117134955.png)