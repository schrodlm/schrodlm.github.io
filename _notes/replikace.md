---
tags: [distributed_system]
source: https://www.youtube.com/watch?v=mBUCF1WGI_I
title: "replikace"
---
Replikace je proces udržování identických kopií dat nebo služeb na více uzlech současně. V distribuovaném systému se jedná o formu **fyzické redundance**.

## Motivace
**Reliability**
- Zajišťuje, že při selhání jednoho uzlu (např. _crash failure_) data nezmizí a systém může dál poskytovat službu z jiné kopie.

**Dostupnost**
- Minimalizuje riziko _Single Point of Failure_ (SPOF).

**Výkon**
- Umožňuje paralelní zpracování požadavků a snižuje latenci tím, že jsou data fyzicky blíže uživateli.

**Transparentnost**
- Cílem je, aby uživatel nevnímal, zda pracuje s jednou kopií nebo deseti

## Hlavní problém: Nekonzistence 
Replikace je sice nástrojem spolehlivosti, ale jejím přímým vedlejším produktem je **nekonzistence stavu**.
**Proč?** 
- Jakmile existuje více kopií, zpráva o změně stavu putuje k ostatním uzlům **rychlostí sítě**, nikoliv okamžitě 
- Různé repliky mohou mít **dočasně odlišný stav** 
- **[Konzistence](/notes/konzistence-distribuovaneho-systemu/)** je pak klíčová vlastnost, která určuje, nakolik jsou data v různých replikách v daném čase shodná.
- **Trade-off:** Silnější konzistence = vyšší latence a nižší dostupnost ([CAP theorem](/notes/cap-theorem/)) 

---
## Strategie replikace

V praxi se setkáváme se dvěma hlavními přístupy k šíření změn mezi replikami:

### Pasivní replikace (Leader-based / Primary-Backup)
- Existuje jeden **leader** a ostatní jsou followers (replicas).
- Lídr je jediným zdrojem pravdy pro modifikace stavu.
- **Příklad - RAFT:** Lídr přijímá požadavky a replikuje je jako logy na ostatní uzly. K potvrzení zápisu mu stačí odpověď od **většiny (kvóra)**.

### Aktivní replikace ([state machine replication (SMR)](/notes/state-machine-replication-smr/))
- Všechny repliky jsou si rovny a každá z nich samostatně zpracovává požadavky.
- Vyžaduje **Totální uspořádání zpráv** (_Total Order_), aby všechny repliky dospěly ke stejnému výslednému stavu.
---
## Synchronní vs. Asynchronní replikace

### Synchronní replikace

**Princip:** Master čeká, až **všechny** (nebo majority) repliky potvrdí.

```
Client → Master.write(x)
Master → replicate to Slaves
Master ← wait for ACK from all
Master → Client: OK
```

**Vlastnosti:**
- ✅ **Silná konzistence** - všechny repliky mají stejná data
- ❌ **Vysoká latence** - čeká se na nejpomalejší repliku
- ❌ **Nižší dostupnost** - pokud replica spadne, zápis selže

**Použití:** Bankovní systémy, kritická data

---

### Asynchronní replikace

**Princip:** Master nepotvrdí replikaci okamžitě.

```
Client → Master.write(x)
Master → Client: OK (okamžitě)
Master → replicate to Slaves (na pozadí)
```

**Vlastnosti:**
- **Nízká latence** - neblokuje klienta
- **Vysoká dostupnost** - výpadek repliky nevadí
- **Eventual consistency** - repliky mohou být dočasně nekonzistentní
- **Riziko ztráty dat** - pokud master spadne před replikací

**Použití:** Social media feeds, cache, read-heavy aplikace

---
## Techniky replikace
### 1. **Log Shipping (Statement-based)**
```
Master: INSERT INTO users VALUES (1, 'Alice')
       → pošli SQL statement na slaves
```
❌ Problém: Non-deterministické funkce (`NOW()`, `RAND()`)
![Image](/assets/img/Pasted image 20260118184423.png)

### 2. [Gossip-based](/notes/epidemicke-protokoly/) (Epidemic)
- Každý uzel náhodně šíří změny sousedům
→ Nakonec se všude rozšíří

Škálovatelné, fault-tolerant 

### 3. [CRDT (conflict-free replicated data types)](/notes/crdt-conflict-free-replicated-data-types/)
- **Princip:** Datové typy navržené tak, aby změny mohly probíhat na libovolné replice nezávisle a bez koordinace (leaderless).
- **Vlastnost:** Matematicky zaručují, že po synchronizaci (např. pomocí Gossipu) se všechny repliky shodnou na stejném stavu bez vzniku konfliktů
- **Vztah ke konzistenci:** Dosahují **Eventual consistency** bez nutnosti drahého globálního konsenzu (na rozdíl od RAFTu či Bitcoinu).

---
## Vztah ke spolehlivosti a stavu
**Čím více stavovosti, tím složitější spolehlivost:** Replikovaný stav musí přežít pády uzlů a po obnovení se musí znovu sjednotit s ostatními.

### TMR (Triple Modular Redundancy)
Extrémní forma replikace, kde tři procesy počítají totéž a o výsledku se hlasuje (2 ze 3 musí souhlasit), což eliminuje chybu jednoho uzlu.

---
## Shrnutí
Podle [CAP theorem](/notes/cap-theorem/) nelze v replikovaném systému při rozdělení sítě zajistit současně konzistenci (C) a dostupnost (A).
- **CP Systémy:** Preferují shodu replik (konzistenci) za cenu dočasné nedostupnosti.
- **AP Systémy:** Preferují dostupnost a akceptují dočasnou nekonzistenci replik (_Eventual Consistency_).