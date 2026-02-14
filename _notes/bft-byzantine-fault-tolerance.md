---
layout: note
title: "BFT (byzantine fault tolerance)"
---

**Byzantine Fault Tolerance (BFT)** je **vlastnost distribuovaného systému**.  
Systém je _Byzantine Fault Tolerant_, pokud funguje správně, i když se některé uzly chovají **byzantsky** (vykazují [byzantine failure](/notes/byzantine-failure.html)).

Nejčastěji se realizuje pomocí **byzantine fault tolerant konsenzus algoritmů** (např. [PBFT (practical byzantine fault tolerance)](/notes/pbft-practical-byzantine-fault-tolerance.html)).

## Formální podmínky BFT konsenzu
Aby byl konsenzus odolný vůči byzantským selháním, musí platit:

- systém má alespoň:   
$$ n \ge 3f + 1 $$
kde:
- $f$ = maximální počet byzantských uzlů
