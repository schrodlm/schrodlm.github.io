---
layout: note
title: "3PC"
---

### Three-Phase Commit (3PC)

**Vlastnosti:**
- ✅ **Neblokující** (oproti 2PC)
- ❌ Složitější
- ❌ V praxi se moc nepoužívá (Paxos/Raft jsou lepší)

**Fáze:**
1. **CanCommit** - příprava
2. **PreCommit** - pre-commit stav
3. **Commit** - finální commit