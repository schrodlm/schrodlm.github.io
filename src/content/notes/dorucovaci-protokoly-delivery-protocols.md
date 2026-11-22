---
title: "doručovací protokoly (delivery protocols)"
---

**Doručovací algoritmy** jsou konkrétní **implementace**, které zajišťují garance daného komunikačního modelu. Jsou to "stavební kameny", které realizují to, co komunikační model slibuje. 

>[!note] Implementace doručovacích algoritmů
>Doručovací algoritmy **využívají** [mechanismy koordinace](/notes/mechanismy-koordinace-v-distribuovanych-systemech/) (token-based, permission-based, quorum-based) pro dosažení svých garancí. 
>**Příklad:** Total order multicast může být implementován pomocí: 
> - Token-based (token nese sekvenční číslo) 
> - Permission-based (ISIS algoritmus - žádost o číslo od všech) 
> - Quorum-based (majority rozhoduje o pořadí)

---

## Vztah: [Komunikační model](/notes/komunikacni-model/) → Algoritmus

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

### Pro [FIFO broadcast](/notes/usporadani-komunikace-v-distribuovanych-systemech/#fifo-uspořádání):
- **Model:** Zprávy od stejného odesílatele dorazí všem ve stejném pořadí
- **Algoritmus:** Sekvenční čísla + fronta zpráv na příjemci
### Pro [kauzální multicast](/notes/usporadani-komunikace-v-distribuovanych-systemech/#kauzální-uspořádání-causal-ordering):
- **Model:** Pokud zpráva $m_1$ kauzálně předchází $m_2$, všichni je uvidí v tomto pořadí
- **Algoritmus:** [trans algorithm](/notes/trans-algorithm/)
### Pro [Total Order multicast](/notes/usporadani-komunikace-v-distribuovanych-systemech/#totální-uspořádání-total-ordering):
- **Model:** Všichni vidí všechny zprávy ve stejném pořadí
- **Algoritmy:**
    - Centralizovaný sekvenční (koordinátor přiděluje čísla)
    - [Lamportovy hodiny](/notes/logicky-cas/#lamportovy-skalární-hodiny) + total ordering
    - ISIS algoritmus (quorum-based)

### Pro spolehlivé doručení:
- **Model:** Zpráva dorazí všem nebo nikomu (atomicita)
- **Algoritmy:**
    - Two-phase commit (2PC)
    - Three-phase commit (3PC)
    - [paxos](/notes/paxos/), [RAFT](/notes/raft/)