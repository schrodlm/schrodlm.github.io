---
layout: note
title: "2Pc"
---

### Two-Phase Commit (2PC)

**Vlastnosti:**
- ✅ Jednoduchý na pochopení
- ❌ **Blokující** - pokud koordinátor spadne, všichni čekají
- ❌ Single point of failure

**Fáze:**
1. **Prepare:** Koordinátor se ptá všech: "Můžete commitnout?"
2. **Commit/Abort:** Pokud všichni ANO → commit, jinak abort

**Použití:** Distribuované transakce (X/Open XA)