---
tags:
  - distributed_system
language: czech
title: "logický čas"
---
Logický čas není fyzikální veličina (netiká v sekundách), ale **diskretní číselný systém**, který slouží k zachycení [kauzálních závislostí](/notes/kauzalni-zavislost/) (příčina → následek) mezi událostmi v [distribuovaném systému](/notes/distributed-system/).

Umožňuje nám odpovědět na otázku: _"Stala se událost A před událostí B, nebo jsou nezávislé?"_ bez použití fyzických hodin.

> [!important]
> **Logický čas** byl vymyšlen **pouze proto**, abychom dokázali strojově zachytit kauzální závislost.
## Princip
Leslie Lamport definoval relaci "stalo se před" (happened-before), značenou $\to$.
- Pokud $a$ a $b$ jsou události v témže procesu a $a$ nastala před $b$, pak $a \to b$.
- Pokud $a$ je odeslání zprávy a $b$ je přijetí této zprávy, pak $a \to b$.
- Transitivita: Pokud $a \to b$ a $b \to c$, pak $a \to c$.
---

## Implementace
Abychom mohli relaci 'Happened-Before' prakticky využívat v algoritmech, potřebujeme událostem přiřadit číselná razítka (timestamps). Existují dva hlavní přístupy lišící se v přesnosti zachycení souběžnosti.

#### Lamportovy (skalární) hodiny
Každý proces $P_i$ udržuje čítač $C_i$.
1. Před každou událostí: $C_i = C_i + 1$.
2. Odeslání zprávy: Připojit timestamp $t = C_i$.
3. Přijetí zprávy $(m, t)$: $C_j = \max(C_j, t) + 1$.

Klíčová vlastnost: $a \to b \implies C(a) < C(b)$.

Zásadní limitace: Implikace neplatí obráceně. Pokud $C(a) < C(b)$, nemůžeme říci, že $a$ kauzálně předchází $b$. Mohou být konkurentní (nezávislé). Lamportovy hodiny nedokáží detekovat souběžnost.

#### Vektorové hodiny (vector clocks)
Řeší limitaci skalárních hodin. Každý proces udržuje vektor $V$ o délce $N$ (počet procesů).
- $V_i[i]$: Počet událostí na samotném procesu $P_i$.
- $V_i[j]$: Vědomost procesu $P_i$ o počtu událostí na procesu $P_j$.

Pravidla aktualizace:
1. Lokální událost na $P_i$: $V_i[i] = V_i[i] + 1$.
2. Odeslání zprávy: Odeslat celý vektor $V$.
3. Přijetí zprávy s vektorem $v$: Pro každé $k$, $V_i[k] = \max(V_i[k], v[k])$. Poté $V_i[i] = V_i[i] + 1$.

Síla vektorových hodin: Umožňují přesně určit vztah dvou událostí.

- $a \to b \iff V(a) < V(b)$ (každá složka $V(a)$ je menší nebo rovna složce $V(b)$ a alespoň jedna je ostře menší).    
- Pokud neplatí $V(a) \le V(b)$ ani $V(b) \le V(a)$, události jsou konkurentní ($a || b$). Toto je nezbytné například pro řešení konfliktů při verzování dokumentů (git merge) nebo v databázích jako Amazon Dynamo.

![Image](/assets/img/Pasted image 20260118184912.png)