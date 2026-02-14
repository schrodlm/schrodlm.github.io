---
layout: note
title: "k-nezávislost"
---

Jedná se o vlastnost [rodiny hashovacích funkcí](/notes/rodina-hashovacich-funkci.html), která zajišťuje že **hashovací hodnoty na libovolných $k$ různých vstupech se chovají jako náhodné a navzájem nezávislé**, pokud je funkce z rodiny vybrána náhodně.

## Definice
Řekneme, že rodina hashovacích funkcí je (k,c)-nezávislá, pokud pro jakýchkoliv $k$ různých klíčů $x_1, \dots, x_k \in \mathcal{U}$ a pro jakýchkoliv $k$ hodnot hashů $z1, \dots, z_k \in {0, \dots, m-1}$ platí:

$$ P_{h\in\mathcal{H}}[h(x_1) = z_1 \land h(x_2) = z_2 \land \dots \land h(x_k) = z_k] = \frac{c}{m^k} $$

>[!note] Terminologie: "k-nezávislost" vs. "(k,c)-nezávislost" 
> Když se řekne pouze „k-nezávislé“, myslí se tím „(k,c)-nezávislé pro nějakou konstantu c“.
> - $c=1$: Perfektní k-nezávislost ($1/m^k$). To platí např. pro [polynomy](/notes/rodina-polynomialnich-hashovacich-funkci.html) před redukcí modulo $m$.
> - $c\geq 1$: Přibližná nezávislost ($c/m^k$) (např. linear hashing)

>[!note] Co to znamená
>Když si představím házení kostkou, ta má 6 stran ($m = 6$). Ta je vlastně $\infty$-nezávislá (když se odprostíme od fyziky). Ať hodím kolikrát chci, není možné říct nic o tom dalším hodu.
> Hashovací funkce jsou často limitované tím, že po $k$ hashování je možné s větší pravděpodobností předvídat co bude další

>[!note] Jak to funguje s útočníkem
>Když si představíme útočníka, který se snaží zjistit něco o naší hashovací funkci, tak ví následující informace:
> - rodinu hashovacích funkcí, kterou používáme
> - jednotlivé dvojice $(x_1, y_1), (x_2, y_2) , \dots$, které už proběhly
> Aby rodina **nebyla** k-nezávislá (tedy aby definice selhala), stačí útočníkovi získat **jakoukoliv výhodu oproti náhodnému hádání ($1/m$)**.

## Reálný příklad na přímce

Docela se mi líbil příklad na přímce. Představme si, že máme klasickou přímku: $y = ax + b$. 

1. Dostanete k dispozici první bod. O přímce nemůžete říci v podstatě nic (jen víte že prochází tímhle bodem)
2. Jakmile dostanete k dispozici druhý bod, jste schopni deterministicky určit definici přímky.
3. Přímka je tedy 2-nezávislá.

## Příklad na hashovací funkci
Pomocí předchozího příkladu na přímku si to můžeme ukázat i na hashovací funkci, konkrétně na lineárním hashování

Mějme prvočíslo $p=5$. Naše univerzum jsou čísla ${0,1,2,3,4}$. Chceme je zahashovat do stejného rozsahu $m = {0,1,2,3,4}$.

**Pohled útočník**
Útočník ví s jakou rodinou hashovacích funkcí pracujeme a vidí jednotlivé klíče a kam se zahashovali.

Otázka je za jak dlouho ($k$) může zjistit jakou specifickou funkci z rodiny jsme si vybrali. (tedy v našem případě zjistit $a$ a $b$).

**Definice rodiny**
Naše rodina funkcí $\mathcal{H}$ jsou všechny funkce ve tvaru:
$$ h_{a,b}(x) = (a \cdot x + b) (\mod 5)$$
, kde $a$ a $b$ jsou náhodně zvolená čísla z ${0,1,2,3,4}$.  Celkem tedy máme **$5 \times 5 = 25$ možných funkcí** (kombinací $a$ a $b$).

1. Vybereme tedy náhodnou funkci $h$ z našeho možného výběru - řekněme, že jsme si vytáhli $a=2, b = 1$. Naše $h$ tedy vypadá: $h(x) = (2x+1) (\mod 5)$

2. Zahashujeme první číslo - $0$
	- tedy dosadíme $2\cdot0 + 1 = 1$
	- zde útočník nedokáže o funkci nic říct
>[!note] Poznámka
>I když by se na první pohled mohlo zdát, že uročník může říct něco o dalším čísle, modulární počítání funguje tak, že útočník je sice schopen vyřadit **20** funkcí z rodiny. Ale zůstalo mu 5.
> - $h_0(x) = 0x + 1$
> - $h_1(x) = 1x + 1$
> - $h_2(x) = 2x + 1$
> - $h_3(x) = 3x + 1$
> - $h_4(x) = 4x + 1$
Když se podíváme, kam co budou tyto funkce vracet pro vstup $x=1$:
> - $h_0(x) = 0 \cdot 1 + 1 = 1$
> - $h_1(x) = 1 \cdot 1 + 1 = 2$
> - $h_2(x) = 2 \cdot 1+ 1 = 3$
> - $h_3(x) = 3 \cdot 1 + 1 = 4$
> - $h_4(x) = 4 \cdot 1 + 1 = 5$

3. Z poznámky zároveň plyne, že jakmile utočník zjistí, kam se hashuje vstup $x=1$, může jednoznačně určit, jakou hashovací funkci používáme. Tento hashovací systém je tedy 2-nezávislý - utočník nedokáže nedokáže říct nic o $(x_2, y_2)$ jen ze znalosti první dvojice. Platí: $$ P_{h\in\mathcal{H}}[h(x_1) = z_1 \land h(x_2) = z_2] = \frac{1}{m^2} $$

## Vztah s [c-univerzálností](/notes/c-univerzalnost.html)

Každý 2-nezávislý systém je automaticky 1-univerzální.

### Důkaz
- Uvažujme, že máme 2-nezávislý systém.

Abychom určili c-nezávislost. Chceme spočítat pravděpodobnost kolize dvou prvků $x \neq y$, tedy $P[h(x) = h(y)]$. 

Protože je systém 2-nezávislý, víme, že platí, pro libovolné $z_1$ i $z_2$:
$$ P[h(x_1) = z_1 \land h(x_2) = z_2] = \frac{1}{m^2} $$ 

tedy i pro $z_1 = z_2$:
$$ P[h(x_1) = z \land h(x_2) = z] = \frac{1}{m^2} $$ 

Kolize může nastat na libovolném indexu. Indexů je $m$. Tedy:
$$P[h(x) = h(y)] = \sum_{z=0}^{m-1} P[h(x) = z \land h(y) = z] = \sum_{z=0}^{m-1} \frac{1}{m^2} = m \cdot \frac{1}{m^2} = \frac{1}{m}$$

Pravděpodobnost kolize je $1/m$ což je přesně definice 1-univerzality.