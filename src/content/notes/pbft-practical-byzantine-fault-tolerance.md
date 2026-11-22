---
title: "PBFT (practical byzantine fault tolerance)"
---

Řeší problém byzantských generálů a obecně [byzantine failure](/notes/byzantine-failure/)


### PBFT (Practical Byzantine Fault Tolerance)

**Vlastnosti:**
- ✅ Praktická implementace BFT
- ✅ Toleruje **f** byzantských selhání s **3f+1** uzly
- ❌ **O(N²) zpráv** - neškálovatelné pro velké systémy
- 🟡 Vyžaduje [permission-based](/notes/permission-based-koordinace/) komunikaci

**Použití:**
- Hyperledger Fabric (blockchain)
- Tendermint (Cosmos blockchain)