---
tags:
  - distributed_system
language: czech
title: "masivně distribuované systémy"
---
**Definice:** Distribuované systémy s **tisíci až miliony uzlů**, často s **nedůvěryhodnými účastníky** a **otevřeným členstvím**.

---

## Klíčové rozdíly od klasických DS
| Vlastnost | Klasické DS | Masivní DS |
|-----------|-------------|------------|
| Počet uzlů | Desítky-stovky | Tisíce-miliony |
| Důvěra | Důvěryhodné uzly | Byzantine účastníci |
| Členství | Uzavřené, známé | Otevřené, anonymní |
| Governance | Centrální autorita | Decentralizované |
| Konsenzus | Paxos/Raft (CFT) | PoW/PoS (BFT) |

**CFT** = Crash Fault Tolerance (uzly jen padají)  
**BFT** = Byzantine Fault Tolerance (uzly mohou lhát, sabotovat)

---

## Fundamentální výzvy

### 1. [Byzantine Generals Problem](/notes/problem-byzantskych-generalu/)
**Problém:** Jak dosáhnout konsenzu, když někteří účastníci jsou zlomyslní?

**Tradiční řešení:** PBFT - Neškáluje nad ~100 uzlů ($O(n²)$ komunikace)
Řešení:

### 2. Sybil Attack
**Problém:** Útočník vytvoří tisíce falešných identit a ovládne síť.

**Obrany:**
- **[proof of work (PoW)](/notes/proof-of-work-pow/)** - útok je drahý (hardware + elektřina)
- [proof of stake (PoS)](/notes/proof-of-stake-pos/) - útok vyžaduje velké držení aktiv
- **Permissioned networks** - kontrola identit

### 3. Škálovatelnost
**Blockchain Trilemma:** Nelze mít současně všechny tři:
1. **Decentralizace** (tisíce nezávislých uzlů)
2. **Bezpečnost** (odolnost proti útokům)
3. **Škálovatelnost** (vysoký throughput)

**Trade-off příklady:**
- [bitcoin](/notes/bitcoin/): Bezpečnost + Decentralizace → nízký throughput (7 tx/s)
- solana: Škálovatelnost + slabší decentralizace
- ethereum: Hledání balance pomocí sharding + L2

---

## Konsenzuální mechanismy
**Problém škálování**
- Paxos/Raft: O(N) komunikace → pro 10 000 uzlů neproveditelné
- PBFT: O(N²) komunikace → neškáluje nad ~100 uzlů

### [Proof of Work](/notes/proof-of-work-pow/) (PoW)
**Princip:** Těžaři soutěží o nalezení hashe splňujícího difficulty.

**Jak funguje:**
1. Těžař vybere transakce do bloku
2. Hledá nonce, aby `hash(block) < target`
3. První úspěšný získá odměnu a broadcast bloku
4. Nejdelší řetězec = platný

**Použití:** Bitcoin, Ethereum (do 2022)

### [Proof of Stake](/notes/proof-of-stake-pos/) (PoS)
**Princip:** Validátoři "stakují" tokeny a jsou vybíráni k vytvoření bloků.

**Jak funguje:**
1. Uživatel zamkne tokeny jako stake
2. Algoritmus vybere validátora (např. náhodně vážené stakeem)
3. Validátor navrhne blok
4. Ostatní ověří a potvrdí
5. Špatné chování → **slashing** (ztráta stakeu)

**Použití:** Ethereum 2.0, Cardano, Polkadot

### Další mechanismy
- **Delegated PoS** - uživatelé volí delegáty (EOS, Tron)
- **Proof of Authority** - známí validátoři (VeChain)
- **Proof of Space** - důkaz volného místa (Chia)

---
## Architektonické vzory
### 1. [Blockchain](/notes/blockchain/)

### 2. DAG (Directed Acyclic Graph)
**Alternativa:** Transakce odkazují na několik předchozích (ne lineární řetězec).

**Výhody:**
- Vyšší throughput (paralelní potvrzování)
- Nižší latence

**Použití:** IOTA (Tangle), Hedera Hashgraph

### 3. Sharding
**Princip:** Rozdělení sítě na menší skupiny (shardy), každý zpracovává část transakcí.

**Výzvy:**
- Cross-shard komunikace
- Bezpečnost jednotlivých shardů

**Použití:** Ethereum 2.0, Zilliqa


---