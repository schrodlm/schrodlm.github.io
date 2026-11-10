---
layout: note
title: "state machine replication (SMR)"
---

**Princip:** Repliky jsou **deterministické stavové automaty**.
- Všechny repliky začínají ve stejném stavu
- Aplikují **stejné operace** ve **stejném pořadí**
- → Končí ve stejném stavu

```
Replica1: start → op1 → op2 → op3 → state_X
Replica2: start → op1 → op2 → op3 → state_X
Replica3: start → op1 → op2 → op3 → state_X
```

**Jak zajistit stejné pořadí?**
- [Konsenzus](/notes/konsenzus-v-distribuovanych-systemech.html) ([Paxos](/notes/paxos.html), [Raft](/notes/raft.html))
- [Total Order Broadcast](/notes/usporadani-komunikace-v-distribuovanych-systemech.html#totální-uspořádání-total-ordering)
>[!note] Konsenzus
> state machine replication **vyžaduje konsenzus** → proto Paxos/Raft!

**Výhody:**
- **[Silná konzistence](/notes/konzistence-distribuovaneho-systemu.html#silná-konzistence-strong-consistency)** (všechny repliky stejné)
- Teoreticky čisté (matematicky dokázatelné)

**Použití:**
- etcd, Consul (Raft-based)
- Google Spanner (Paxos-based)
- Distribuované databáze

