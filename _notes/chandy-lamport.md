---
layout: note
title: "Chandy Lamport"
---

Algoritmus **Chandy-Lamport** je elegantní způsob, jak v distribuovaném systému „vyfotit“ jeho stav (udělat **snapshot**), aniž bychom museli zastavit celý svět. Jelikož v systému neexistují globální hodiny, nemůžeme prostě říct: „Všichni teď hned udělejte fotku.“


### Základní myšlenka: Princip „markerů“

Algoritmus nepracuje s časem, ale s posíláním speciálních kontrolních zpráv, kterým se říká **markery**.

#### Průběh ve 3 jednoduchých krocích:
1. **Iniciace (Někdo začne):**
    - Uzel (např. P1​) se rozhodne udělat snapshot.
    - Zaznamená svůj **vlastní lokální stav**.
    - Okamžitě pošle zprávu **marker** do všech svých odchozích kanálů (všem sousedům).
    
2. **Šíření (Ostatní se přidávají):**
- Když jiný uzel (P2​) obdrží marker poprvé:
- Zaznamená svůj **lokální stav**.
- Poznamená si, že kanál, po kterém marker přišel, je prázdný.
- Pošle marker dál všem svým sousedům.

1. **Záznam kanálů (Chytání zpráv „na cestě“):**
- Pokud uzel už svůj stav zaznamenal a přijde marker z jiného kanálu:
    - Ukončí nahrávání pro tento konkrétní kanál.   
    - Všechny běžné zprávy, které mu přišly tímto kanálem **mezi** momentem, kdy uložil svůj stav, a momentem, kdy přišel marker, se považují za **zprávy na cestě**.
---
### Proč je to tak důležité?
Tento algoritmus řeší problém, že v distribuovaném systému nelze spolehlivě provádět okamžité globální kontroly. Výsledný snapshot je **konzistentní**, což znamená: