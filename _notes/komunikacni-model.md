---
layout: note
title: "Komunikacni Model"
---

## Komunikační model

Komunikační model je **vysokoúrovňová abstrakce** nad [komunikací v distribuovaných systémech](/notes/komunikace-v-distribuovanych-systemech/), kterou poskytuje [middleware](/notes/middleware/) distribuovaným aplikacím. 

Definuje **pravidla interakce** (např. [RPC](/notes/rpc/), message passing, pub/sub) a **garance** ohledně spolehlivosti, pořadí doručení a chování při selhání, čímž skrývá složitost fyzické sítě.

**Komunikační model** je **specifikace** (co chceme). Je implementován konkrétními **protokoly** (jak to uděláme), které používají **algoritmy** (logika implementace).

**Příklad:**
- Model: Causal multicast
- Protokol: Vector clock-based multicast protocol
- Algoritmus: Vector clock algorithm + message buffering

---

## Garance komunikačních modelů

Každý komunikační model poskytuje specifické **garance**, které odpovídají na fundamentální otázky:

### 1. [Uspořádání](/notes/usporadani-komunikace-v-distribuovanych-systemech/)
**Otázka:** V jakém pořadí zprávy uvidím?

**Garance:**
- FIFO order
- Causal order
- Total order
- No order (best effort)

### 2. [Spolehlivost](/notes/spolehlivost-delivery-semantics/)
**Otázka:** Dostanu zprávu vůbec – a kolikrát?

**Garance:**
- At-most-once (může se ztratit)
- At-least-once (může duplikovat)
- Exactly-once (právě jednou)

### 3. Členství _(pouze pro skupinovou komunikaci)_
**Otázka:** Kdo všechno se komunikace účastní?

**Garance:**
- Static membership (fixní skupina)
- Dynamic membership (join/leave)
- [virtuální synchronie](/notes/virtualni-synchronie/) (view synchrony)

**Platí:**
- **Point-to-point (1:1):** pořadí + spolehlivost
- **Multicast (1:N, N:M):** pořadí + spolehlivost + členství
---
## [Vztah ke konzistenci](/notes/vztah-mezi-komunikacnimi-modely-a-konzistenci-v-distribuovanych-systemech/)

**Model konzistence** (např. linearizability, causal consistency) je **cílový stav** dat/paměti.

**Komunikační model** je **prostředek**, jak konzistence dosáhnout:
- Sequential consistency → Total order multicast
- Causal consistency → Causal order multicast
- Eventual consistency → Best-effort delivery

**Fyzikální vlastnosti komunikace limitují maximální dosažitelnou konzistenci.**