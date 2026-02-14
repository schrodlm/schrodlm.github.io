---
tags:
  - distributed_system
language: czech
title: "koordinace a synchronizace v distribuovaném systému"
---
# Koordinace a synchronizace v distribuovaných systémech

V distribuovaných systémech chybí **sdílená paměť** a **globální hodiny**. 
To vytváří fundamentální problém: **Jak zajistit, aby procesy spolupracovaly a nepřekážely si?**

Tento problém se nazývá **koordinace** a jeho řešení vyžaduje **synchronizaci** - 
koordinovanou spolupráci procesů pomocí výměny zpráv.

---
## Proč je koordinace obtížná?

1. **Absence sdílené paměti** - procesy nemohou přímo sdílet stav
2. **Absence globálních hodin** - těžké určit pořadí událostí  
3. **Asynchronní komunikace** - zprávy dorazí v různém pořadí/zpoždění
4. **Selhání** - procesy a síť mohou selhat kdykoliv

**Důsledek:** Musíme explicitně řešit problémy, které v centralizovaných 
systémech řeší OS automaticky (mutexes, semafory, system clock).

---
## Dva pilíře synchronizace

### 1. Časová synchronizace
**Otázka:** Jak sjednotit pohled na čas?

#### [Fyzický čas (Physical Clock Sync)](/notes/physical-clock-sync/)
Synchronizace reálného času (hodiny na zdi) mezi uzly.

#### [Logický čas (Logical Time)](/notes/logicky-cas/)
Místo sekund měříme [kauzální pořadí](/notes/kauzalni-zavislost/) událostí. 
Pokud události nesouvisí, jsou **souběžné** (concurrent).

**Použití:** Ordering zpráv, conflict detection, debugging distribuovaných systémů

---
### 2. Koordinace akcí
**Otázka:** Jak zajistit, aby procesy spolupracovaly bez konfliktů?

Řešíme **synchronizační problémy** - konkrétní koordinační úlohy:

#### [Vzájemné vyloučení (Mutual Exclusion)](/notes/vzajemne-vylouceni-v-distribuovanych-systemech/)
**Problém:** Kdo smí vstoupit do kritické sekce?

Náhrada za semafory/mutexy v prostředí bez sdílené paměti.

**Algoritmy:** Centralized, Token Ring, Ricart-Agrawala, Maekawa

#### [Volba koordinátora (Leader Election)](/notes/volba-koordinatora-leader-election/)
Algoritmy pro výběr nového leadera (např. po pádu toho starého).
**Problém:** Kdo bude vůdce skupiny?
**Algoritmy:** Bully, Ring-based, Raft election

#### [Konsenzus (Agreement)](/notes/konsenzus-v-distribuovanych-systemech/)
**Problém:** Jak se shodnout na jedné hodnotě?
Dosažení shody mezi procesy i při selháních.

**Algoritmy:** Paxos, Raft

**Limity:** konsenzus v distribuovaných systémech#FLP Impossibility - konsenzus v asynchronním systému 
s možností selhání není vždy možný

#### [Transakce](/notes/transakce-v-distribuovanych-systemech/)
**Problém:** Jak zajistit ACID vlastnosti napříč více uzly?
**Trade-off:** Konzistence vs. dostupnost (blokující při výpadcích)
**Algoritmy:** 2PC, 3PC

#### [Group Membership](/notes/group-membership/)
**Problém:** Kdo je členem skupiny?
- Kdo všechno je součástí skupiny v daný okamžik
- Jak se skupina mění při pádech a připojeních
**Použití:** Multicast groups, cluster management, failure tracking

#### [Detekce globálního stavu](/notes/detekce-globalniho-stavu/)
**Problém:** V jakém stavu náš systém je? Jsou nějaké uzly mrtvé?
**Trade-off:** Rychlost detekce vs. přesnost (false positives)

---
## Mechanismy koordinace

Všechny synchronizační problémy lze řešit pomocí tří základních [návrhových vzorů](/notes/mechanismy-koordinace-v-distribuovanych-systemech/).

---
## Klíčová poznání 
1. **Synchronizace ≠ Paralelismus** 
- synchronizace je o koordinaci, ne o současném běhu 
1. **Časová synchronizace je nástroj** 
- logické hodiny se používají v koordinačních algoritmech 
1. **Mechanismy jsou vzory** 
- stejný mechanismus (např. quorum) se používá v různých problémech (ME, konsenzus, replikace) 
1. **Trade-offy jsou nezbytné** 
- nelze mít nízkou latenci, vysokou odolnost a nízký počet zpráv současně