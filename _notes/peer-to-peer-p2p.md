---
tags:
  - distributed_system
language: czech
title: "peer-to-peer (P2P)"
---
Architektura pro [distribuovaný systém](/notes/distributed-system.html)

Decentralizovaný model.
- **Role:** Každý uzel (peer) je zároveň klientem i serverem (tzv. _servent_).
- **Charakteristika:** Vysoká škálovatelnost (přidáním uzlu roste výpočetní výkon i kapacita), robustnost (není SPOF).
- **Dělení:**
    - **Nestrukturované:** Data jsou rozmístěna náhodně (hledání probíhá metodou záplavy/flooding).
    - **Strukturované (DHT - distributed hash tables):** Striktní matematická pravidla, kam se data ukládají (např. algoritmus Chord). Umožňuje efektivní vyhledávání O(logN).

>[!note] Klient-server role
>V P2P síti jsou všechny uzly vybaveny jak **klientským softwarem** (schopnost iniciovat spojení), tak **serverovým stubem** (schopnost naslouchat a vyřizovat požadavky).

## Stavovost
- P2P sítě jsou **inherentně stavové** v tom smyslu, že každý uzel si musí pamatovat své sousedy (routing table).

- Pokud uzel "zapomene" své sousedy (ztratí stav), vypadne ze sítě a musí znovu provést proces připojení (Bootstrap/Discovery).
- U strukturovaných P2P (DHT) uzel drží část globálního stavu (např. klíče od A do F).