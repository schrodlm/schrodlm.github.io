---
layout: note
title: "rodina hashovacích funkcí"
---

Rodina [hashovacích funkcí](/notes/hashovaci-funkce.html) je **množina více hashovacích funkcí** se stejným typem vstupu a výstupu, ze které můžeme náhodně vybírat.

## Intuitivní vysvětlení

Místo toho, abychom měli **jednu pevnou** hashovací funkci $h$, máme **celou kolekci funkcí** $\mathcal{H} = \{h_1, h_2, h_3, \ldots\}$ a při vytváření hashovací tabulky **náhodně vybereme** jednu z nich.

## Formální definice
Rodina hashovacích funkcí $\mathcal{H}$ je množina funkcí:
$$\mathcal{H} = \{h: U \to [m]\}$$

## Proč se používají?
Pokud máme jen jednu pevnou hashovací funkci $h$, útočník může:
1. Zjistit jakou funkci používáme
2. Najít klíče, které všechny hashují na stejnou pozici
3. Způsobit degradaci na $\mathcal{O}(n)$ složitost

## Příklady
1. [rodina lineárních hashovacích funkcí](/notes/rodina-linearnich-hashovacich-funkci.html)
2. [scalar product hash family](/notes/scalar-product-hash-family.html)
3. [rodina polynomiálních hashovacích funkcí](/notes/rodina-polynomialnich-hashovacich-funkci.html)
4. [rodina rolling hash](/notes/rodina-rolling-hash.html) (pro řetezce/vektory)
#### Příklady složených rodin
1. [složená rodina rolling hash](/notes/slozena-rodina-rolling-hash.html)
