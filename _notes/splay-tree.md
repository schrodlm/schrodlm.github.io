---
layout: note
title: "Splay Tree"
---

## Definice
Jedná se o stromovou datovou strukturu (binary search tree, která se sama vyvažuje pomocí operací `find`, `insert`, `delete`) a zaručuje [amortizovanou složitost](/notes/amortized-complexity/) ($O(\log n)$) na všechny tyto operace. 

To znamená, že jedna operace může trvat worst-case $O(n)$, ale pro $m$ operací platí složitost $O(\log m)$.

## Princip
Funguje na principu [splay](/notes/splay/) operace, které udržuje strom přibližně vybalancovaný.

Všechny klasické operace (`insert`, `find`, `delete`) jsou zkombinované se [splay](/notes/splay/). Splayování strom restrukturuje a prvek se kterým jsme pracovali se vždy dostane do kořene (a zároveň většinou spraví část stromu)

> [!important] Z toho plyne
> Nedávno přistupované uzly mají tendenci zůstávat blíž kořenu (#Access lemma (Věta o přístupu))

## Výhody
Oproti ostatním samovyvažovacím stromovým strukturám, má splay tree dvě hlavní výhody:
1. Nemusí si ukládat vyvažovací informace (jako např. red-black tree, AVL tree)
2. Díky principy algoritmu operací `find`, `insert` a `delete` se často přistupované prvky udržují na vrcholu stromu a zaručují rychlý přístup

## Nevýhody
1. Jedna konkrétní operace může v nejhorším případě trvat $O(n)$ ([amortized complexity](/notes/amortized-complexity/))
2. Čtení tedy zapisuje do paměti. `find` operace modifikuje strukturu. (těžší paralelismus, cache trashing)

---
## Splay 
[splay](/notes/splay/)

---
## Operace
Popis tří hlavních operací `find`, `insert` a `delete`
### `find(x)`
Myšlenka operace je nalezení libovolného prvku ve splay tree a amortizovaná složitost je $O(\log n)$.

**Algoritmus**
1. Pokusíme se najít hledaný prvek $x$. (klasickým algoritmem pro binary search tree)
Můžou nastat dvě situace:
- prvek $x$ nalezneme
	2. [splayujeme](/notes/splay/) nalezený prvek do kořene pomocí splay algoritmu
- prvek $x$ nenalezneme
	2. to znamená, že jsem v listu stromu, tento prvek tedy [splayujeme](/notes/splay/) až do kořene (provádíme to z důvodu zachování amortizované složitosti)

### `insert(x)`
Myšlenka operace `insert` je možné vložení nového prvku (pokud se ve stromě již nenachází)

**Algoritmus**
1. Pokusíme se najít hledaný prvek $x$. (klasickým algoritmem pro BVS)
Můžou nastat dvě situace:
- prvek $x$ nalezneme
	2. splayujeme nalezený prvek do kořene pomocí splay algoritmu a nic do stromu nevkládáme
- prvek $x$ nenalezneme
	2. vložíme tedy prvek jako nový list a zároveň tento list vysplaujeme

### `delete(x)`
Myšlenka operace `delete` je možné smazání prvku (pokud se ve stromě nachází)

**Algoritmus**
1. Pokusíme se najít hledaný prvek $x$. (klasickým algoritmem pro binary search tree)
Můžou nastat dvě situace:
- prvek $x$ nalezneme
	2. prvek vysplaujeme až do kořene stromu a poté odstraníme, tím nám vzniknou dva nové stromy. Ty spojíme tak, že najdeme největší prvek v levém stromě, ten vysplaujeme, jelikož je to největší prvek tak nebude mít pravého syna a tedy můžeme celý pravý strom připojit jako pravé dítě
- prvek $x$ nenalezneme
	2. vysplaujeme list u kterého jsme skončili vyhledávání
---
## Access lemma (Věta o přístupu)
K vyslovení této věty potřebujeme nadefinovat pár termínů.

Nejprve zavedeme značení (bez toho ta věta nedává smysl):
- $s(x)$ = velikost podstromu zakořeněného v $x$ (počet vrcholů).
- $r(x)=\log ​s(x)$ (tzv. **rank** uzlu).
- Potenciál stromu $\Phi = \sum_{x\in T}{r(x)}$

Moje pochopení termínů v [vysvětlení access lemma pro splay trees](/notes/vysvetleni-access-lemma-pro-splay-trees/)
### Lemma
Amortizovaná složitost vysplayování prvku $x$ do kořene $t$ je nejvíce $3 \times (r(t) - r(x)) + 1 = O(\log n)$

### Předpoklady
- Jeden krok **zig** stojí 1 jednotku času (1 rotace).
- Kroky **zig-zig** a **zig-zag** stojí 2 jednotky času (2 rotace).
- **suma logaritmů** - $\log a + \log b \leq 2 \cdot \log (a+b) - 2$

### Důkaz
Potřebuji dokázat, že toto tvrzení platí pro
- jednotlivé kroky (jednu operaci zig/zig-zig, zig-zag)
- pro celou sekvenci kroků (sekvence zig, zig-zig, zig-zag)

### 1. Důkaz pro jednotlivý krok (jednu splay operaci)
Musím ukázat, že pro každý typ kroku (zig, zig-zig, zig-zag) platí, že jeho amortizovaná cena je omezena rozdílem ranků $x$ před a po provedení operace. Tedy, že amortizovaná složitost jedné splay operace je nejvíce $3 \times (r'(x) - r(x)) + 1$, kde $r(x)$ je rank prvku $x$ před operací splay a $r'(x)$ je rank po operaci.

#### zig-zag
Jediné prvky, které se mohou změnit ranky jsou $x$, $p$ a $g$.
![Image](/assets/img/Pasted image 20251008202601.png)
Tedy $\Phi += (r'(x) - r(x)) + (r'(p) - r(p)) + r'(g) - r(g))$. Reálná cena operace je $2$, tedy amortizovaná cena podle vzorce:  

Amortizovaná cena ($A$) =  Skutečná cena + Změna potenciálu($\Delta \Phi$)

bude

$$ A = 2 + r'(x) + r'(p) + r'(g) - r(x) - r(p) - r(g) $$

Chceme tedy dokázat, že $A \leq 3 \cdot r'(x) - r(x)$. Musíme tedy všechny ostatní ranky omezit pomocí $r(x)$ a $r'(x)$. 

1. Použijeme sumu logaritmů na $r'(p) + r'(g)'$:
$$ r'(p) + r'(g) = \log s'(p) + \log s'(g) \leq 2 \cdot \log(s'(p) + s'(g)) - 2$$

2. Víme, že podstromy $T'(p)$ a $T'(g)$ jsou disjunktní a jsou obsaženy v $T'(x)$, víme tedy, že musí platit: $\log(s'(p) + s'(g)) \leq \log s'(x) = r'(x)$ a tedy platí $$r'(p) + r'(g) \leq 2 \cdot r'(x) - 2$$
3. Výsledek můžeme nahradit v nerovnosti pro amortizovanou složitost $$ A = 3r'(x) - r(x) - r(p) - r(g) $$
4. Zbývající ranky $r(p)$ a $r(g)$ můžeme jednoduše omezit pomocí $r(x)$, protože $T(x)$ je jistě menší než $T(p)$ a $T(g)$. 
$$
\begin{align} 
r(p) \geq r(x)\\ 
r(g) \geq r(x)
\end{align}
$$

#### zig-zig
Stejná myšlenka platí i pro zig-zig. Znovu je reálná cena $2$. Ranky se mohou měnit pouze pro $x$, $p$ a $g$.
![Image](/assets/img/Pasted image 20251008202505.png)

Takže amortizovaná cena bude
$$ A = 2 + r'(x) + r'(p) + r'(g) - r(x) - r(p) - r(g) $$

1. Chceme nahradit $r'(g)$ pomocí $r(x)$ a $r'(x)$  Použijeme sumu logaritmů:

$$\begin{align}
r(x) + r'(g) & = \log s(x) + log s'(g) \\
& \leq 2 \log (s(x) + s'(g)) - 2 \\
& \leq 2 \log s'(x) - 2 = 2r'(x) - 2
\end{align}$$

2. Z toho již plyne, že $r'(z) \leq 2r'(x) - r(x) - 2$. Po nahrazení do rovnice amortizované ceny:
$$ A \leq 3r'(x) + r'(p) - 2r(x) - r(p) - r(g)$$

3. Všechny ostatní výrazy už jsou trivální
$$
\begin{align}
r(g) &= r'(x) &\text{protože  } T(g) = T'(x) \\
r(p) &\geq r(x) &\text{protože  } T(p) \supseteq T(x) \\
r'(p) &\leq r'(x) &\text{protože  } T'(p) \subseteq T'(x) \\
\end{align}
$$

4. Z čehož tedy vyplývá, rovnice
$$ \begin{align}
&A \leq 4r'(x) - 2r(x) - r(x) - r'(x) \\
&A \leq 3r'(x) - 3r(x) 
\end{align}
$$

#### zig
- Potřebuji dokázat, že $A \leq 3(r'(x)-r(x))+1$.

Reálná cena operace je $1$. Ranky se mohou měnit pouze v $x$ a $p$.
![Image](/assets/img/Pasted image 20251008201252.png)
Amortizovaná cena tedy bude vypadat takto:
$$ A = 1 + r'(x) + r'(y) - r(x) - r(y) $$

1. Víme, že $r'(p) \leq r'(x)$ a $r(p) \geq r(x)$, tedy
$$
\begin{align}
A &\leq 1 + 2r'(x) - 2r(x) \\
1 + 2r'(x) - 2r(x) &\leq 1 + 3r'(x) - 3r(x) \\
A &\leq 1 + 3r'(x) - 3r(x)
\end{align}
$$

> Můžeme provést úpravu v druhém řádku, protože víme, že $r'(x) - r(x)$ není nikdy záporná.

### Důkaz pro splayování
Když provedeme celou operaci splay, je to posloupnost kroků. Pak tedy $r_0(x)$ je rank na začátku a $r_k(x)$ je rank po $k$-krocích. 

Celková amortizovaná cena operace je součet cen jednotlivých kroků:
$A_{\text{total}} = \sum_{i=0}^{k}{A_i}$

Jelikož podle předchozího důkazu víme, že pro všechny tři různé kroky (zig, zig-zig, zig-zag) platí:
$$ 3 \times (r'(x) - r(x)) + 1 $$ 

Můžeme rovnici sepsat jako
$$ A_{\text{total}} \leq \sum(3 \times (r_i(x) - r_{i-1}(x))) + 1$$
(+ 1 je za případný poslední zig, který může nastat v kořeni)

Využitím teleskopické sumy (jednotlivé prvky se mezi sebou odečítají) zbude jen první a poslední člen
$$ 
\begin{align}
A_{\text{total}} &\leq 3(r_k(x) - r_0(x)) + 1 \\ 
A_{\text{total}} &\leq 3(r(t) - r(x)) + 1
\end{align}
$$ když si nyní vzpomeneme na definici $r(x)$:
$$ r(v)=\log_2​(\text{počet uzlů v podstromu v})$$
Dosadíme maximální možnou hodnotu pro $r(t)$ a minimální pro $r(x)$ (abychom získali horní odhad):

$$
\begin{align}
A_\text{total}​&≤3\cdot(\log_2​n−0)+1 \\
A_\text{total}​&≤3 \cdot \log_2 ​n+1
\end{align}
$$
### Závěr
Výraz $3 \cdot \log_2 ​n+1$ patří do třídy složitosti $O(\log n)$