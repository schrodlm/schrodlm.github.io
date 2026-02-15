---
layout: note
title: "doručovací protokoly (delivery protocols)"
---

**Doručovací algoritmy** jsou konkrétní **implementace**, které zajišťují garance daného komunikačního modelu. Jsou to "stavební kameny", které realizují to, co komunikační model slibuje. 

>[!note] Implementace doručovacích algoritmů
>Doručovací algoritmy **využívají** [mechanismy koordinace](/notes/mechanismy-koordinace-v-distribuovanych-systemech.html) (token-based, permission-based, quorum-based) pro dosažení svých garancí. 
>**Příklad:** Total order multicast může být implementován pomocí: 
> - Token-based (token nese sekvenční číslo) 
> - Permission-based (ISIS algoritmus - žádost o číslo od všech) 
> - Quorum-based (majority rozhoduje o pořadí)

---

## Vztah: [Komunikační model](/notes/komunikacni-model.html) → Algoritmus

**Komunikační model říká "CO":**
- "Chci FIFO pořadí zpráv"
- "Chci atomické doručení všem"
- "Chci kauzální uspořádání"

**Doručovací algoritmus říká "JAK":**
- Konkrétní protokol/postup
- Struktury dat (fronty, timestampy, vektorové hodiny)
- Zprávy navíc, potvrzování, synchronizace

---
## Konkrétní příklady:

### Pro FIFO broadcast:
- **Model:** Zprávy od stejného odesílatele dorazí všem ve stejném pořadí
- **Algoritmus:** Sekvenční čísla + fronta zpráv na příjemci
### Pro kauzální multicast:
- **Model:** Pokud zpráva $m_1$ kauzálně předchází $m_2$, všichni je uvidí v tomto pořadí
- **Algoritmus:** [trans algorithm](/notes/trans-algorithm.html)
### Pro Total Order multicast:
- **Model:** Všichni vidí všechny zprávy ve stejném pořadí
- **Algoritmy:**
    - Centralizovaný sekvenční (koordinátor přiděluje čísla)
    - Lamportovy hodiny + total ordering
    - ISIS algoritmus (quorum-based)

### Pro spolehlivé doručení:
- **Model:** Zpráva dorazí všem nebo nikomu (atomicita)
- **Algoritmy:**
    - Two-phase commit (2PC)
    - Three-phase commit (3PC)
    - [paxos](/notes/paxos.html), [RAFT](/notes/raft.html)