---
tags: [distributed_system]
language: cz
title: "mechanismy koordinace v distribuovaných systémech"
---
V distribuovaných systémech bez sdílené paměti potřebujeme **explicitní koordinaci** mezi procesy. Existují tři základní mechanismy, jak toho dosáhnout:

1. [Token-based](/notes/token-based-koordinace/) - Předávání unikátního tokenu
2. [Permission-based](/notes/permission-based-koordinace/) - Žádost o povolení od ostatních
3. [Quorum-based](/notes/quorum-based-koordinace/) - Hlasování v podmnožinách

>[!important] Leader-based 
>V základní klasifikaci rozlišujeme **3 strategie**:
>- **Permission-based, Token-based, Quorum-based**.
>
> V širším architektonickém pohledu mezi koordinační přístupy patří i [leader-based koordinace](/notes/leader-based-koordinace/), která je jednoduchá, ale leader představuje **single point of failure**
> Algoritmy typu **RAFT** kombinují **centralizované řízení (Leader)** s **quorum-based rozhodováním** (potvrzení většinou).

---
## Proč potřebujeme koordinační mechanismy?

Distribuované systémy řeší **fundamentální problém synchronizace**:

> Jak zajistit, aby procesy spolupracovaly a nepřekážely si, když nemají sdílenou paměť ani globální hodiny?

**Konkrétní problémy:**

- Kdo smí vstoupit do kritické sekce? → [Mutual exclusion](/notes/vzajemne-vylouceni-v-distribuovanych-systemech/)
- V jakém pořadí všichni uvidí zprávy? → doručovací protokoly
- Na jaké hodnotě se shodneme? → [Konsenzus](/notes/konsenzus-v-distribuovanych-systemech/)
- Kdo je leader? → [Leader election](/notes/volba-koordinatora-leader-election/)

Všechny tyto problémy řeší **stejné tři koordinační vzory**.

---
## Společné vlastnosti

Všechny tři mechanismy řeší:

1. **Bezpečnost (Safety):** Maximálně jeden proces v kritické sekci / všichni vidí stejné pořadí
2. **Živost (Liveness):** Každá žádost je nakonec vyřízena (za předpokladu, že procesy neselhávají)
3. **Férové uspořádání:** Žádný proces nečeká nekonečně dlouho (obvykle pomocí timestampů)

**Hlavní rozdíl** je v tom, **kolik procesů musí spolupracovat** a **jak se zvládají selhání**.

---
## Jak vybrat mechanismus?

| Požadavek | Doporučený mechanismus |
|-----------|------------------------|
| Malý systém (N < 20), nízká konkurence | Token-based |
| Férové uspořádání, plná distribuce | Permission-based |
| Velký systém (N > 50), odolnost vůči výpadkům | Quorum-based |

**Příklad:** Mutual exclusion může být implementován všemi třemi způsoby - 
Token Ring (token), Ricart-Agrawala (permission), Maekawa (quorum).

---
## Trade-offy
```
Centralizace (Token) ←→ Distribuce (Permission/Quorum)
Nízké zprávy (Token)  ←→ Vysoké zprávy (Permission)
Nízká odolnost (Token) ←→ Vysoká odolnost (Quorum)
Jednoduchá logika (Token) ←→ Složitá logika (Quorum)
```
**Neexistuje "nejlepší" mechanismus** - záleží na konkrétním problému a prostředí.