---
layout: note
title: "Sprava Prostredku A Procesu V Distribuovanem Systemu"
---

Co to je? V čem je to důležité? Proč to řešíme?

Tady jsou asi příklady co spravujeme?
##  [Distribuované zablokování](/notes/deadlock-v-distribuovanem-systemu/) (deadlock)
V distribuovaném systému je detekce deadlocku složitější, protože neexistuje centrální tabulka zámků.

- **Strategie:** 
1. _Prevence_ (např. pomocí časových razítek – Wait-Die nebo Wound-Wait). 
2. _Detekce a zotavení_ (vyhledání cyklu a násilné ukončení procesu).

---
## [Vzdálené spouštění procesů a migrace](/notes/vzdalene-spousteni-procesu-a-migrace/)


---
### Vyvažování zátěže ([load balancing v distribuovaných systémech](/notes/load-balancing-v-distribuovanych-systemech/))
Cílem je zajistit, aby žádný uzel nebyl přetížen, zatímco jiný zahálí. Tím přímo naplňujeme motivaci pro **scaling** a **výkon**.

- **Statické:** Rozdělení úkolů je pevně dané (např. Round Robin).
- **Dynamické:** Rozhoduje se podle aktuálního stavu (CPU load, volná RAM).
    
- **Mechanismy:**
    - _Sender-initiated:_ Přetížený uzel hledá někoho, komu by práci předal.
    - _Receiver-initiated:_ Volný uzel se „hlásí o práci“.