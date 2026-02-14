---
layout: note
title: "Volba Koordinatora Leader Election"
---

Mnoho algoritmů vyžaduje centrálního koordinátora. Pokud koordinátor spadne, musí být zvolen nový. Předpokládá se, že každý proces má unikátní ID.

---
![Image](/assets/img/Pasted image 20260118202616.png)
# Algoritmy
## Bully Algoritmus
- Proces $P$ si všimne, že koordinátor neodpovídá. Pošle zprávu ELECTION všem procesům s vyšším ID.
- Pokud nikdo neodpoví (je tedy procesem s nejvyšším živým ID), prohlásí se za vítěze (COORDINATOR).
- Pokud odpoví někdo s vyšším ID, $P$ odstoupí a čeká. Vyšší proces převezme volbu.
- Název: Proces s nejvyšším ID "šikanuje" ostatní a vždy vyhraje. Generuje velký provoz ($O(N^2)$) v nejhorším případě.
    
## Ring Algoritmus
- Zpráva ELECTION obíhá po kruhu. Každý proces do ní přidá své ID (pokud je živý).
- Když se zpráva vrátí k iniciátorovi, obsahuje seznam všech živých ID.
- Iniciátor vybere nejvyšší ID jako koordinátora a pošle zprávu COORDINATOR s výsledkem po kruhu.
- Výhoda: Menší zátěž sítě než Bully, ale závislost na kruhové topologii.