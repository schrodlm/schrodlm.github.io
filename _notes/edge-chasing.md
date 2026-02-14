---
layout: note
title: "edge-chasing"
---

### Jak funguje detekce (Algoritmus "Edge-Chasing")

Místo toho, abychom složitě stavěli celý graf na jednom místě, používá se elegantní metoda posílání speciálních zpráv, tzv. **sond (probes)**.
1. **Iniciace:** Pokud proces P1​ čeká příliš dlouho na prostředek, začne mít podezření. Vytvoří sondu (zprávu), která obsahuje ID procesů: `(P1, P1, P2)`. Tedy: „Já P1​ posílám sondu od P1​ směrem k P2​“.
2. **Předávání:** Když proces P2​ dostane tuhle sondu a sám na někoho čeká (třeba na P3​), pošle ji dál: `(P1, P2, P3)`.
3. **Detekce:** Pokud se ta samá sonda nakonec vrátí k původnímu odesílateli (P1​), znamená to, že prošla celým kruhem.
- **Výsledek:** P1​ ví, že je v deadlocku.