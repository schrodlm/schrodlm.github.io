---
layout: note
title: "Transakce V Distribuovanych Systemech"
---

nějak souvisí s konsenzem ale nevím moc jak. Něco ve smyslu:

Ale zároveň:

| Vlastnost   | Konsenzus             | Commit           |
| ----------- | --------------------- | ---------------- |
| Vstup       | různé návrhy hodnot   | lokální „ano/ne“ |
| Výstup      | jedna vybraná hodnota | commit / abort   |
| Koordinátor | volitelný             | nutný (2PC)      |
| Odolnost    | vůči pádům            | často blokuje    |
| Použití     | replikace, leader     | transakce        |


### Souvislost s konsenzem
> **Konsenzus ⇒ commit**  
> **Commit ⇏ konsenzus**
- Když máš Paxos/Raft:
    - můžeš implementovat atomický commit

- Když máš 2PC:    
    - **nemáš obecný konsenzus**

## Algoritmy transakce
- [2PC](/notes/2pc/)
- [3PC](/notes/3pc/)