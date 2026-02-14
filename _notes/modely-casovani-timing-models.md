---
layout: note
title: "modely časování (timing models)"
---

_Předtím, než navrhneme algoritmus, musíme definovat, co předpokládáme o čase v síti a na uzlech._

1. **Synchronní systém (Ideál):**
    - Existují známé a pevné horní meze pro doručení zprávy (Δ) i pro rychlost procesoru (T).
    - _Vlastnost:_ Pokud zpráva nedorazí včas, víme jistě, že uzel selhal.
    - _Realita:_ V běžných sítích (Internet) neexistuje. Používá se jen v real-time systémech (letadla, auta).
        
2. **Asynchronní systém (Pesimistický):**
    - Neexistují **žádné** meze. Zpráva může letět sekundu nebo rok.
    - _Vlastnost:_ Nelze odlišit "pomalý uzel/síť" od "mrtvého uzlu".
    - _Důsledek:_ **FLP Impossibility** – v tomto modelu nelze dosáhnout konsenzu, pokud vypadne i jen jeden uzel.
        
3. **Parciálně synchronní systém (Realita):**
    
    - Systém se většinu času chová synchronně, ale občas limity poruší (přetížení sítě).
    - _Vlastnost:_ Algoritmy používají **timeouty**, aby se s tímto stavem vypořádaly.
    - _Využití:_ Paxos, Raft, Bitcoin.