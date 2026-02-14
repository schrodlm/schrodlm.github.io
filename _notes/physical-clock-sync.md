---
layout: note
title: "Physical Clock Sync"
---

Snaha o synchronizaci reálného času (hodiny na zdi) kvůli logování, vypršení platnosti (TTL) a interakci s lidmi.
- **Problém:** Krystalové oscilátory mají odchylku → vzniká **clock drift**.
- **Cíl:** Udržet hodiny v toleranci δ (maximální odchylka).
## Algoritmy
1. **NTP (network time protocol)
    - Hierarchický systém (Stratum 0, 1, 2...). Klienti se synchronizují proti serverům s atomovými hodinami.
2. **Cristianův algoritmus (Pasivní):**
    - Klient se ptá serveru na čas.
    - Výpočet: Tnew​=Tserver​+(RTT/2).
    - _Předpoklad:_ Cesta tam i zpět trvá stejně dlouho.
        
3. **Berkeley algoritmus (Aktivní):**
    - Master server (Daemon) se ptá ostatních na čas.
    - Vypočítá průměr (zahodí extrémy).
    - Pošle uzlům instrukci: _"Posuň si hodiny o +X"_. (Interní synchronizace).