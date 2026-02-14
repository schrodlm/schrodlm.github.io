---
layout: note
title: "RAFT"
---

Algoritmus k dosažení [konsenzu](/notes/konsenzus-v-distribuovanych-systemech.html).
Předpokládá parciálně synchronní a crash fault tolerant model.

Navržen jako srozumitelná alternativa k Paxosu. Rozděluje problém na: Volbu lídra, Replikaci logu a Bezpečnost.

1. Volba Lídra (Leader Election): Využívá náhodné timeouty. Pokud follower nedostane heartbeat od lídra, stane se kandidátem a žádá o hlasy. Vyhrává ten, kdo získá většinu.
    
- Safety: Uzel dá hlas kandidátovi jen tehdy, pokud je kandidátův log alespoň tak aktuální jako jeho vlastní.
    
1. Replikace Logu: Klient posílá příkazy pouze lídrovi. Lídr je přidá do logu a posílá followerům (AppendEntries).
    
2. Commit: Záznam je commitován, až když je replikován na většinu uzlů.