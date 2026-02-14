---
layout: note
title: "Detekce Terminace V Distribuovanem Systemu"
---

Řeší jak poznat zda výpočet opravdu skončil a v síti už "nelétají" žádné zprávy. Nestačí jen, aby byly všechny procesy v pasivním stavu (nečinné). V komunikačních kanálech mohou stále existovat zprávy, které po doručení některý proces opět aktivují

## Cíl 
Algoritmus musí zajistit, aby se v konečném čase (typicky iniciační proces) dozvěděl, že jsou všechny procesy pasivní a v síti již nejsou žádné "létající" zprávy.

**Řešení:** K tomuto účelu slouží algoritmy jako **Dijkstra-Scholten** (pomocí stromové struktury a potvrzování) nebo **Huangův algoritmus** (pomocí vah zpráv).


## Dijkstra-Scholten
Vytváří se dynamická orientovaná kostra grafu (otec-syn). Signál o ukončení se posílá "otci", až když je uzel pasivní a dostal signály od všech svých "synů".