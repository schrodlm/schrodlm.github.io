---
layout: note
title: "State Machine Replication Smr"
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
- [Konsenzus](/notes/konsenzus-v-distribuovanych-systemech/) ([Paxos](/notes/paxos/), [Raft](/notes/raft/))
- Total Order Broadcast
>[!note] Konsenzus
> state machine replication **vyžaduje konsenzus** → proto Paxos/Raft!

**Výhody:**
- **Silná konzistence** (všechny repliky stejné)
- Teoreticky čisté (matematicky dokázatelné)

**Použití:**
- etcd, Consul (Raft-based)
- Google Spanner (Paxos-based)
- Distribuované databáze

