---
layout: note
title: "vysvětlení access lemma pro splay trees"
---

### Proč definujeme rank $r(x)$?
Rank představuje jakousi důležitost prvku. List má malý rank. Kořen má největší rank. Prvky který splayujeme se postupně mění rank tak že odebírá rank ostatním prvkům. Vlastně je tam analogie toho, že **čím větší máš podstrom (rank), tím výše ve stromu pravděpodobně jsi**

Pro mě bylo extrémně neintuitivní proč používáme rank a ne hloubku. Hloubka uzlu je představuje cenu (počet rotací), kterou procesor vykoná. Problém je, že hloubka se strašně rychle mění. Jedním Zig-Zig krokem se hloubka celého podstromu změní. Takže by byly potřeba extrémně složité rovnice.

Access Lema se vlastně snaží říct: _Cena operace je úměrná tomu, o kolik se zvýší "důležitost" (rank) uzlu x během jeho cesty nahoru._

### Jak funguje potenciál $\Phi$?
Potenciál nám podle jeho definice vlastně říká, jak špatně vybalancovaný splay strom je.

Splay strom, který je lineární bude mít velký potenciál, vybalancovaný strom bude mít malý potenciál.

Potenciál totiž zároveň představuje jakousi energii, kterou strom za svůj život nabyl tak, aby ji mohl vypotřebovat na svoje vybalancování. 

**Formálně**

$$c'_i = c_i + \Delta \phi = c_i +\Phi(T_{\text{po}}) - \Phi(T_{\text{před}})$$
- $c'_i​$ - amortizovaná cena i-té operace (počet rotací)
- $c_i$​ - skutečná cena i-té operace (počet rotací)
- $\Phi$ je potenciálová funkce.

Vysoký potenciál $\Phi$ degenerovaného stromu představuje předplacenou práci. Drahé operace (s vysokým $c_i$​) nutně vedou k redukci tohoto potenciálu ($\Delta \Phi ≪ 0$), čímž se skutečná cena operace kompenzuje a amortizovaná cena $c'_i$​ zůstává nízká."

![Image](/assets/img/Pasted image 20260104154509.png)

Pokud je skutečná cena velmi drahá, aby amortizovaná složitost stále platila, bude muset být velká i změna potenciálu, aby se cena vyvážila

### Jak funguje [amortizovaná složitost](/notes/amortized-complexity/)
Amortizovaná cena =  Skutečná cena + Změna potenciálu($\Delta \phi$)

- **Skutečná cena:** To, co procesor oddře (hloubka).
- **Změna potenciálu:** O kolik se strom zlepší/zhorší.
- **Amortizovaná cena:** To, co "účtujeme uživateli".