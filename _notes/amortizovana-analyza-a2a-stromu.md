---
layout: note
title: "amortizovaná analýza (a,2a-stromů)"
---

## Věta o amortizovaném počtu změn pro (a,2a)-stromy

**Věta:** Posloupnost $m$ operací `insert` a `delete` provedených na zpočátku prázdném (a,2a)-stromu provede celkem $O(m)$ modifikací vrcholu.

**Důsledek:** Amortizovaný počet modifikací vrcholu na jednu operaci je konstantní, tedy $O(1)$.

### Důkaz
>[!note] Princip
> Důkaz využívá [potenciálovou metodu](/notes/potential-method.html). 

Definujeme cenu operace jako počet uzlů, které modifikuje. Cílem je najít takovou potenciálovou funkci $\Phi$, aby amortizovaná cena drahých operací (štěpení a merge uzlů) byla nulová nebo záporná, a pouze základní vložení/smazání mělo konstantní kladnou cenu

**Definice potenciálu:** Potenciál celého stromu je součtem příspěvků jednotlivých uzlů. Uzel s k klíči přispívá hodnotou $f(k)$. Funkce $f(k)$ je navržena tak, aby "trestala" uzly, které jsou blízko extrémům (úplně plné nebo téměř prázdné), a byla nulová pro "ideální" uzly uprostřed.

Pro (a,2a)-stromy definujeme funkci $f(k)$ následovně (s konstantou $c=2$):

| Počet klíčů (k)      | $a−2$ (podtečení) | $a−1$ | $a < k < 2a-2$ | $2a−1$ | $2a$ |
| -------------------- |:-----------------:| ----- | ------------ | ------ | ---- |
| **Potenciál $f(k)$** |         2         | 1     | 0            | 2      | 4    |

**Analýza operací:**

1. **Štěpení (Split):**
    - Nastává, když má uzel $2a$ klíčů. Jeho potenciál je $4$.
    - Rozštěpením vzniknou dva uzly s $⌊\frac{2a-1}{2}=a−1⌋$ a $⌈\frac{2-a1}{2}​⌉=a$ klíči (jeden klíč jde nahoru).
    - Nový potenciál těchto uzlů je $$f(a−1)+f(a)=1+0=1$$
    - **Uvolněný potenciál:** $4−1=3$.
    - Tento uvolněný potenciál (3 jednotky) zaplatí modifikaci dvou štěpených uzlů a vložení klíče do rodiče. Amortizovaná cena štěpení je tedy $\leq0$.

**Slučování (Merge):**
- Nastává při sloučení podtečeného uzlu ($a−2$ klíčů, potenciál $2$) se sourozencem na minimu ($a−1$ klíčů, potenciál $1$). Celkový potenciál před akcí je $3$.
- Vznikne uzel s $(a-2) + (a-1) + 1 = 2a- 2$. Jeho potenciál je $f(2a-2) = 0$
- **Uvolněný potenciál:** $3-0 = 3$
- To opět stačí na pokrytí reálné ceny operace (modifikace uzlů + úprava rodiče)

**Zhotovení důkazu**
Cílem je dokázat, že součet skutečných změn (real cost) za $m$ operací je $O(m)$

$$\sum\text{Amortizovaná cena} = \sum\text{Reálná cena} + \Delta \Phi $$
(změna potenciálu). Protože potenciál $\Phi$ je na začátku $0$ a vždy nezáporný ($\Phi \geq 0$), platí, že součet reálných cen je menší nebo roven součtu amortizovaných cen.

### Důkaz pro `insert`
Operaci `insert` můžeme rozložit na dvě fáze:

1. **Vložení do listu:** Přidání klíče do příslušného listového uzlu.
2. **Štěpení (splitting):** Pokud dojde k přeplnění, uzel se štěpí a vkládá klíč do rodiče. Toto se může opakovat.

> Spočítáme jaká je cena těchto jednotlivých částí operace a pak je spojíme

**Vložení do listu**
Nechť $v$ je list, do kterého vkládáme.

- **Reálná cena** ($c_\text{base}$​): $1$(modifikujeme jeden uzel).
- **Změna potenciálu** ($\Delta \Phi_\text{base}$): Počet klíčů se zvýší o 1. Tedy potenciál se podle tabulky zvýší max o $c=2$
- **Amortizovaná cena**
$$ \hat{a}_\text{base} = c_\text{base} + \Delta \Phi_\text{base} = 1 + 2 = 3 = O(1)$$

**Štěpení uzlu (Split)**
Předpokládejme, že uzel v má $2a$ klíčů (přeplnění). Musíme ho rozštěpit na $v1​,v2​$ a vložit klíč do rodiče $p$.

Musíme ověřit nerovnost pro "štěpení zdarma":

$$ f(2a) \geq f(a) + f(a-1) + c + 1 $$
>[!note] Co to znamená
> $f(2a)$ je potenciál uzlu, který právě prasknul, podle definice $f$ je tato hodnota vysoká
> 
> Aby bylo štěpení "zadarmo" (amortizovaně), musí uvolněná částka pokrýt tyto čtyři položky
> 1.  $f(a)$ - potenciál prvního vytvořeného uzlu
> 2. $f(a-1)$ - potenciál druhého vytvořeného uzlu
> 3. $c$ - potenciál rodiče se může zvýšit (až o 2), jelikož do něj posíláme jeden klíč
> 4. $1$ - reálná cena práce

$$
\begin{align}
4&≥0+1+2+1 \\
4&≥4
\end{align}
$$
- nerovnost tedy platí a můžeme spočítat amortizovanou cenu

1. **Reálná cena** ($c_\text{split}$): Modifikujeme $v1​,v2​$ a $p$. Řekněme 1 jednotka (ve škálovaném modelu).
>[!note] Škálovatelný model
> Učitelé si tady zjednodušili práci. Místo toho, aby pracovali s velkými čísly (reálná cena splitu = 3, potenciál 12), všechno vydělili konstantou tak, aby cena vyšla **1**.
2. **Změna potenciálu** ($\Delta \Phi_\text{split}​$):
	- úbytek: Odstraníme uzel s $2a$ klíči ($\Phi -= 4$)
	- přírůstek: 
		1. vzniknou $v_1$ a $v_2$ ($\Phi += 0 + 1$)
		2. rodič $p$ zvýší počet klíčů o 1 (max $\Phi += 2$)
	$\Delta \Phi_\text{split}$ = (1 + 0 + 2) - 4 = -1
3. **Amortizovaná cena**
$$ \hat c_\text{split}  = c_\text{split} + \Delta \Phi_\text{split} \leq 1 + (-1) = 0$$

Z toho plyne, že amortizovaná cena každého štěpení je $\leq 0$

#### Závěr důkazu

Celková amortizovaná cena operace `insert`, která se skládá z jednoho vložení do listu a k štěpení, je:

$$ \hat c_\text{total} = \hat c_\text{base} + \sum_{i=1}^{k}\hat c_\text{split}$$

Dosadíme naše výsledky:

$$ \hat c_\text{total} \leq 3 + \sum_{i=1}^k 0 = 3$$
Tedy $$\hat{c}_\text{total}​=O(1)$$

**Q.E.D.** – počet změn uzlů je lineární vzhledem k počtu operací, tedy konstantní na jednu operaci.

---
## Rozdíl oproti (a,2a−1)-stromům
U stromů, kde je horní limit $b$ nastaven na minimum 2a−1, **tato věta neplatí**.

**problém oscilace:** Hranice pro rozštěpení $(b+1=2a)$ a hranice pro sloučení po smazání jsou příliš blízko u sebe. Chybí zde tzv. "breathing space" (prostor pro dýchání).

**worst case scenario:** V (a,2a−1)-stromu se může stát, že operace `insert` vynutí štěpení uzlů v celé cestě až ke kořeni (strom je "napnutý"). Pokud hned poté následuje `delete`, může tato operace veškerou práci zrušit a vynutit slučování uzlů zpět až ke kořeni.

**důsledek:** Můžeme zkonstruovat posloupnost operací, kde se střídá `insert` a `delete`, přičemž každá operace bude mít reálnou cenu $Ω(\log n)$. Amortizovaná složitost tedy nebude konstantní.

---
## Shrnutí
Abychom dosáhli konstantního amortizovaného počtu změn, musíme zvolit $b≥2a$, což struktuře poskytne dostatečnou rezervu, aby nedocházelo k okamžitému reverzování strukturálních změn.