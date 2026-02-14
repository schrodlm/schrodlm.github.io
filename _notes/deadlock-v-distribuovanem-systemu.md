---
layout: note
title: "deadlock v distribuovaném systému"
---

**Zablokování** nastává, když skupina procesů vzájemně čeká na prostředky, které drží ostatní členové skupiny, a nikdo nemůže pokračovat. Tedy klasický [race condition](/notes/race-condition.html), ale s jiným univerzem než u paralelního programování.

>[!note] Složitost
> V distribuovaném systému je detekce deadlocku složitější, protože neexistuje centrální tabulka zámků.

- **Detekce:** Využívají se algoritmy založené na **grafu čekání ([Wait-For-Graph (WFG)](/notes/wait-for-graph-wfg.html))**. Pokud se v distribuovaném grafu objeví cyklus, nastal deadlock.

## Problémy

### Problém "Falešného deadlocku" (phantom deadlock)
V distribuovaném systému hrozí, že algoritmus detekuje deadlock, který ve skutečnosti neexistuje.
**Příčina:** Zpoždění zpráv v síti.
**Scénář:** Proces P1​ uvolní prostředek, ale zpráva o uvolnění dorazí k detektoru později než zpráva o tom, že na něj někdo jiný začal čekat.
**Důsledek:** Detektor vidí cyklus, který v reálném čase nikdy neexistoval (nekonzistentní řez)

### Problém v distribuovaném systému
V lokálním počítači má operační systém celý graf u sebe. V distribuovaném systému je ale graf „rozstříhaný“:

- Uzel $A$ ví, že $P_1​→P_2$​.
- Uzel $B$ ví, že $P2​→P3​$.
- Uzel $C$ ví, že $P3​→P1$​. 
**Žádný uzel sám o sobě cyklickou závislost.**

---
# Distribuované algoritmy detekce

Materiály uvádějí několik metod, jak cykly v distribuovaném WFG najít:

### Centralizovaný a hierarchický algoritmus
- **Centralizovaný:** Existuje jeden koordinátor (resource manager), kterému uzly posílají své lokální změny grafu.
- **Hierarchický:** Deadlocky se řeší nejdříve lokálně, a pokud přesahují hranice uzlu, řeší je nadřazený koordinátor.

### Path-pushing
- Uzly si mezi sebou posílají informaci o svých závislostech.
- Při detekci závislosti na vzdáleném uzlu se tato informace "potlačí" dál, dokud se někde nesestaví celý cyklus.

### [Edge chasing](/notes/edge-chasing.html) (algoritmus sond)
- Nejpoužívanější metoda, reprezentovaná algoritmem **Chandy-Misra-Haas**.
- **Princip:** Pokud je proces blokován, vyšle speciální zprávu (**sondu/probe**) všem procesům, na které čeká.
---
