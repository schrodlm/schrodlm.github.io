---
layout: note
title: "Scalar Product Hash Family"
---

Systém [hashovacích funkcí](/notes/hashovaci-funkce/) založených na skalárním součinu a důkaz jeho [1-univerzálnosti](/notes/c-univerzalnost/)

# Definice systému
Uvažujme hashování vektorů, kde univerzum tvoří $d$-rozměrné vektory nad tělesem $\mathbb{Z}_p^d$​ (kde $p$ je prvočíslo). Tento systém je definován následovně:
- **[Rodina funkcí](/notes/rodina-hashovacich-funkci/)**: Označme rodinu $S = \{h_t | t \in \mathbb{Z}_p^d\}$
- Parametr: Funkce je určena náhodně zvoleným vektorem $t \in \mathbb{Z}_p^d$
- Předpis funkce: Pro vektor $x$ je hashovací funkce definována jako skalární součin vektoru $x$ a parametru $t$:
$$ h_t(x) = t \cdot x = \sum_{i=1}^{d} t_i x_i \mod p$$
Výběr náhodné funkce i její vyhodnocení trvá čas $O(d)$

### Důkaz 1-univerzálnosti

**Věta:** Rodina $S$ je 1-univerzální. To znamená, že pro libovolné dva různé vektory $x,y \in \mathbb{Z}_p^d$​ je pravděpodobnost kolize $P[h_t​(x)=h_t​(y)] \leq 1/p$ (protože velikost oboru hodnot $m=p$, odpovídá to definici c-univerzálnosti pro $c=1$).

**Důkaz:**
1. Mějme dva různé vektory $x$ a $y$. Jelikož jsou různé, musí se lišit alespoň v jedné souřadnici.
2. Protože skalární součin nezávisí na pořadí složek, můžeme si souřadnice přečíslovat tak, aby se lišily v poslední souřadnici $d$ (tedy $x_d​ \neq y_d$​).
3. Hledáme pravděpodobnost jevu $h_t(x) = h_t(y)$, což je ekvivalentní rovnici:
$$
\begin{align}
x \cdot t &= y \cdot t \\
(x-y)\cdot t &= 0 \\
\sum_{i=1}^{d} (x_i - y_i)t_i &= 0
\end{align}
$$
4. Rovnici upravíme tak, abychom vyjádřili člen s poslední souřadnicí $t_d$
$$ (x_d - y_d)t_d = - \sum_{i=1}^{d-1}(x_i - y_i)t_i$$

5. Nyní uvažujme náhodnou volbu složek vektoru $t$:
- předpokládejme, že jsme již pevně zvolili prvních $d-1$ složek ($t_1,\dots,t_{d-1}$). Tím je pravá strana rovnice fixní číslo
- Protože $x_d \neq y_d$ a počítáme v tělese $\mathbb{Z}_p$ je výraz ($x_d - y_d$) nenulový a existuje k němu inverzní prvek
- Rovnice je tedy lineární rovnicí o jedné neznáme $t_d$ tvaru $A \cdot t_d = B$ (kde $A \neq 0$). Taková rovnice má v tělese $\mathbb{Z}_p$ právě jedno řešení pro $t_d$

6. Jelikož $t_d$ vybíráme z $\mathbb{Z}_p$ náhodně a rovnoměrně (z $p$ možností) a pouze jedna z těchto možností způsobí kolizi, je pravděpodobnost kolize přesně $1/p$

Tím je dokázáno, že systém je **1-univerzální**
