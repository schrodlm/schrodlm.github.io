---
tags:
  - distributed_system
  - consensus
language: czech
title: "konsenzus v distribuovaných systémech"
---
**Konsenzus** (agreement, shoda) je fundamentální problém [koordinace](/notes/koordinace-a-synchronizace-v-distribuovanem-systemu/): Jak dosáhnout **shody** mezi procesy na **jedné hodnotě**, i když některé uzly selhávají nebo je síť nespolehlivá?

Je to jeden z nejtěžších a nejdůležitějších problémů v distribuovaných systémech.

> [!note] Vztah k uspořádání (komunikace v distribuovaných systémech)#Totální uspořádání (total ordering)
> Totální uspořádání a dosažení konsensu je ve své podstatě ten samý problém. V totálním uspořádání se uzly musejí dohodnout jaká je jedna korektní sekvence zpráv. 
> Algoritmy na tyto dva problémy se dají použít na oba

---

## Proč je konsenzus důležitý?
Konsenzus je **základní stavební kámen** pro:
- **[State Machine Replication](/notes/state-machine-replication-smr/)** - všechny repliky musí aplikovat operace ve stejném pořadí
- **[Leader Election](/notes/volba-koordinatora-leader-election/)** - kdo je leader?
- **[Group Membership](/notes/group-membership/)** - kdo je součástí skupiny?
- **Distribuované databáze** - na jaké hodnotě se shodneme?
- **Blockchain** - jaký je další blok v řetězci?

**Bez konsenzu nelze stavět spolehlivé distribuované systémy.**

---
## [vztah konsenzu a detekce globálního stavu](/notes/vztah-konsenzu-a-detekce-globalniho-stavu/)
---
## Formální definice problému
Proces $P_i$ navrhuje hodnotu $v_i$. Konsenzus algoritmus musí zajistit:

### 1. **Termination**
Každý správný (nehavarovaný) proces se nakonec rozhodne pro nějakou hodnotu.
### 2. **Agreement**
Všechny správné procesy se rozhodnou pro **stejnou** hodnotu.

$$\forall i, j: \text{decide}_i = \text{decide}_j$$
### 3. **Validity**
Pokud se všechny procesy rozhodnou pro hodnotu $v$, pak $v$ byla navržena nějakým procesem.

**Jinými slovy:** Nelze "vymyslet" hodnotu, která nebyla navržena.
### 4. **Integrity**
Každý proces se rozhodne **nejvýše jednou**.

---
## Teoretické limity

### [problém dvou armád](/notes/problem-dvou-armad/)
V nespolehlivé síti nelze dosáhnout 100% jistoty o shodě (nekonečná regrese potvrzení).

### FLP impossibility
V asynchronním systému nelze garantovat deterministický konsenzus při selhání byť jen jednoho procesu.

**Jak to obejít v praxi?**
1. **Částečná synchronie** - předpoklad, že zprávy dorazí "nakonec" (ne nekonečně dlouho)
2. **Timeouts** - považuj proces za mrtvý po timeoutu (riziko false positive)
3. **Randomizace** - probabilistické algoritmy (např. Ben-Or)
4. **Failure detectors** - odhad, kdo je živý/mrtvý

**Praktické algoritmy ([paxos](/notes/paxos/), [RAFT](/notes/raft/)):**
- Obětují **garantovanou terminaci** (mohou se zaseknout při edge cases)
- Ale v praxi fungují dobře (částečná synchronie drží)

---
# Rozdělení konsenzus algoritmů

## Podle typu selhání

### Crash fault tolerance (CFT)
- [paxos](/notes/paxos/) - složitý, teoreticky elegantní
- [RAFT](/notes/raft/) - jednodušší
### Byzantine Fault Tolerance (BFT)
Algoritmy pro systémy, kde procesy mohou **lhát** nebo se chovat **libovolně špatně**.
- [PBFT (practical byzantine fault tolerance)](/notes/pbft-practical-byzantine-fault-tolerance/)

### Probabilistický BFT:
- [proof of work (PoW)](/notes/proof-of-work-pow/) - Bitcoin, Ethereum (do 2022)
- [proof of stake (PoS)](/notes/proof-of-stake-pos/) - Ethereum 2.0, Cardano
- Škáluje na tisíce uzlů

## Podle centralizace
| Typ                | Příklad     | Leader?           | Zprávy  | Odolnost |
| ------------------ | ----------- | ----------------- | ------- | -------- |
| **Leader-based**   | Raft, Paxos | Ano (volený)      | $O(N)$  | Failover |
| **Leaderless**     | PBFT, PoW   | Ne                | $O(N²)$ | Vysoká   |

---
## Srovnání nejdůležitějších algoritmů
| Vlastnost  | [paxos](/notes/paxos/)            | [RAFT](/notes/raft/)                     | [proof of work (PoW)](/notes/proof-of-work-pow/) (Bitcoin)      |
| ---------- | -------------------- | ---------------------------- | -------------------------------------- |
| Hlavní cíl | Bezpečnost, Obecnost | Srozumitelnost, Implementace | Sybil resistence, Open membership      |
| Lídr       | Dočasný (Proposer)   | Silný, stabilní              | Probabilistický (kdo najde blok)       |
| Bezpečnost | Absolutní (Safety)   | Absolutní (Safety)           | Pravděpodobnostní (Confirmation depth) |
| Komunikace | $O(N)$ zpráv         | $O(N)$ zpráv                 | Gossip / Flooding                      |

---

## Kdy použít který konsenzus?

### Paxos
- Potřebuješ teoreticky čistý, provably-correct algoritmus
- Staví se kritická infrastruktura (Google-level)
- Máš tým schopný pochopit a implementovat Paxos správně

### Raft:
- Chceš consensus pro praktickou aplikaci
- Potřebuješ srozumitelnou implementaci
- Staví se distribuovaná databáze, koordinační služba
- **Většina případů** - Raft je lepší volba

### PBFT/BFT:
- Permissioned blockchain
- Kritická infrastruktura s možností kompromitace uzlů
- Do ~100 uzlů

### Proof of Work
- Veřejný, permissionless blockchain
- Tisíce neznámých uzlů
- Můžeš obětovat energii za decentralizaci
- Nízký throughput je akceptovatelný

### Proof of Stake

- Veřejný blockchain s nižší spotřebou energie
- Vyšší throughput než PoW
- Riziko centralizace (bohatí validují více)
---

## Praktické systémy používající konsenzus

| Systém | Algoritmus | Použití |
|--------|-----------|---------|
| **Google Chubby** | Multi-Paxos | Lock service, coordination |
| **Google Spanner** | Paxos | Globální SQL databáze |
| **etcd** | Raft | Kubernetes coordination |
| **Bitcoin** | Proof of Work | Public blockchain |

---

## Klíčová poznání
1. **Konsenzus je hard** - FLP dokázal, že v asynchronních systémech je teoreticky neřešitelný
2. **Praktické algoritmy fungují** - díky částečné synchronii a timeoutům
3. **Quorum je klíč** - většina algoritmů používá [majority quorum](/notes/quorum-based-koordinace/)
4. **Trade-off: CFT vs. BFT**
   - CFT (Paxos/Raft): Rychlejší, jednodušší, ale nepočítá se zlovolnými uzly
   - BFT (PBFT/PoW): Odolnější, ale pomalejší a složitější
1. **Raft > Paxos** (pro většinu aplikací) - jednodušší, srozumitelnější, stejně správný