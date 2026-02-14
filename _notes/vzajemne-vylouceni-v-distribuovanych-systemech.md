---
layout: note
title: "vzájemné vyloučení v distribuovaných systémech"
---

Jak zajistit, aby do kritické sekce (CS) v [distribuovaných systémech](/notes/distributed-system/) vstoupil v daný okamžik jen jeden proces, když nemáme sdílenou paměť (a nemůžeme tedy použít klasická [synchronizační primitiva](/notes/synchronizacni-primitiva/))? Jedná se o [mechanismus koordinace](/notes/mechanismy-koordinace-v-distribuovanych-systemech/). Existují tři hlavní přístupy.

#### 1. Token-Based (Např. token ring)
Procesy jsou logicky uspořádány do kruhu. Mezi nimi obíhá speciální zpráva – **Token**.

- Princip: Kdo má token, může vstoupit do CS. Po opuštění CS pošle token dál.
- Výhody: Zaručuje férovost, nehrozí hladovění (starvation).
- Nevýhody: Ztráta tokenu je fatální a obtížně detekovatelná (musí se generovat nový). Velká latence, pokud nikdo nechce do CS, ale token musí oběhnout celý kruh.
#### 2. Permission-Based (Např. Ricart-Agrawala, [Lamportův algoritmus](/notes/lamportuv-algoritmus/))
Proces žádá o povolení všechny ostatní.
- Princip: Proces $P_i$ pošle REQUEST(timestamp) všem. Ostatní odpoví OK, pokud sami nejsou v CS a nemají žádost s nižším timestampem (priorita starším). $P_i$ vstoupí, až dostane $N-1$ odpovědí.
- Nevýhody: $N$ bodů selhání. Pokud jeden proces spadne a neodpoví, systém se zablokuje. Vysoký počet zpráv ($2(N-1)$).
#### 3. Quorum-Based (např. [Maekawa's algorithm](/notes/maekawas-algorithm/))
Proces žádá o povolení jen podmnožinu procesů (kvorum).
- Podmínka: Každá dvě kvora se musí protínat (mít alespoň jednoho společného člena). Tento společný člen zajistí vyloučení (nedá hlas dvěma zájemcům současně).
- Výhoda: Snižuje počet zpráv na $\approx \sqrt{N}$.


### Srovnání implementací
| Algoritmus       | Typ        | Počet zpráv (CS vstup)  | Odolnost vůči chybám                |
| ---------------- | ---------- | ----------------------- | ----------------------------------- |
| Token Ring       | Token      | 1 až $\infty$ (oběh)    | Nízká (ztráta tokenu)               |
| Centrální Server | Permission | 3 (Req, Grant, Release) | Nízká (Single Point of Failure)     |
| Ricart-Agrawala  | Permission | $2(N-1)$                | Velmi nízká (všichni musí být živí) |
| Maekawa          | Quorum     | $\approx 3\sqrt{N}$     | Střední (stačí živé kvorum)         |

---
## Praxe
V praxi je distribuované zamykání extrémně složité na odladění. Proto se používají centralizované služby.

### Centralizované služby (distributed lock managers)
Místo aby se uzly dohadovaly mezi sebou (peer-to-peer), použije se externí vysoce spolehlivá služba, která zámky spravuje.

- **Technologie:** **Zookeeper**, **Etcd**, **Consul** (nebo Google Chubby).
- **Jak to funguje:** Tyto služby uvnitř používají silný konsenzus (Raft/Paxos). Aplikace si jen "pronajme" zámek (Lease).
    - _Příklad:_ Kubernetes používá Etcd k volbě leadera. Kdo zapíše do Etcd první, je leader.
