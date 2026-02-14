---
layout: note
title: "rodina lineárních hashovacích funkcí"
---

### Lineární hashování $\mathcal{L}$ (linear hashing)
Toto je základní metoda využívající modulární aritmetiku (založená na [lineární kongruenci](/notes/linearni-kongruence.html))

**Parametry**
Zvolíme prvočíslo $p$ a počet přihrádek $m$, kde $m \leq p$.

**[Rodina funkcí](/notes/rodina-hashovacich-funkci.html)**
Rodina $\mathcal{L}$ se skládá ze všech funkcí tvaru $h_{a,b}$, kde parametry $a$ a $b$ jsou z množiny ${0,\dots, p-1}$.

**Funkce**
[Hashovací funkce](/notes/hashovaci-funkce.html) vypadá následovně:
$$ h_{a,b} = ((ax + b) \mod p) \mod m$$

**Vlastnosti**
Tato rodina je:
- 2-univerzální
- (2,4)-nezávislá
---
## Důkaz 2-nezávislosti
Chceme dokázat, že systém $\mathcal{L}$ je 2-nezávislý (konkrétně (2,4)-nezávislý).

Důkaz rozdělíme na dva kroky:
1. analyzujeme vnitřní lineární funkci v tělese $\mathbb{Z}_p$, 
2. poté aplikujeme [lemma o modulení](/notes/lemma-o-moduleni.html)

### 1. Analýza vnitřní funkce v $\mathbb{Z}_p$
Uvažujme pomocnou rodinu lineárních funkci bez finálního modula $m$:
$$g_{a,b}(x) = (ax + b) \mod p$$
Tyto funkce mapují $\mathbb{Z}_p$ do $\mathbb{Z}_p$.

Tvrzení: Tato rodina je (2,1)-nezávislá. 
**Důkaz:**
1. Zvolme libovolné dva různé prvky $x_1​,x_2​∈\mathbb{Z}_p$​ a dvě cílové hodnoty $y_1​,y_2\in\mathbb{Z}_p​$.
2. Hledáme pravděpodobnost, že náhodně zvolená funkce $g_{a,b}$ zobrazí $x_1 \to y_1$ a $x_2 \to y_2$. To vede na soustavu lineárních rovnic nad tělesem $\mathbb{Z}_p$
$$ 
\begin{align}
ax_1 + b  = y_1 \\
ax_2 + b = y_2
\end{align}
$$
3. Odečtením rovnic dostaneme $a(x_1​−x_2​)=y_1​−y_2$​. Protože $x1 \neq x2$​ a jsme v tělese (modulo prvočíslo), existuje inverzní prvek k $(x_1​−x_2​)$ a $a$ je určeno jednoznačně. Následně je jednoznačně určeno i $b$.
4. Existuje tedy **právě jedna** dvojice $(a,b)$ z celkových $p^2$ možných dvojic, která podmínku splňuje .
5. Pravděpodobnost je tedy přesně $1/p^2$. Protože velikost cílového prostoru je $p$, odpovídá hodnota $1/p^2$ přesně definici (2,1)-nezávislosti.

### 2. Aplikace [lemmatu M](/notes/lemma-o-moduleni.html)
Nyní se vrátíme k původní funkci $h_{a,b}​(x)=g_{a,b}​(x)\mod m$.
1. Víme, že vnitřní rodina funkci (mapující $[p]$) je (2-1)-nezávislá (tedy $c =1, r = p$).
2. Aplikujeme lemma M, které říká, že po zavedení operace $\mod m$ se nezávislost změní z ($2,c$) na ($2,4c$).
3. Dosazením $c=1$ získáme, že výsledná rodina $\mathcal{L}$ je (2,4)-nezávislá.

### Závěr
Systém lineární kongruence je (2,4)-nezávislý. To znamená, že pravděpodobnost, že se dva konkrétní prvky zobrazí do dvou konkrétních přihrádek, je nejvýše $4/m^2$.

---
## Důkaz 2-univerzality
>[!note] Souvislost s (2,4)-nezávislostí 
>(2, 4)-nezávislost implikuje **4-univerzalitu**.
>
> Nezávislost je strukturálně silnější a implikuje univerzalitu. Nicméně přímý důkaz univerzality u lineárních funkcí nám dává **silnější (lepší) konstantu** (2/m) než ta, která plyne z nezávislosti (4/m).

**Závěr:** Nezávislost je strukturálně silnější a implikuje univerzalitu. Nicméně přímý důkaz univerzality u lineárních funkcí nám dává **silnější (lepší) konstantu** (2/m) než ta, která plyne z nezávislosti (4/m).
Mějme prvočíslo $p$ a počet příhrádek $m$ (kde $m \leq p$). Rodinu funkcí definujeme jako:
$$ h_{a,b} = ((ax + b) \mod p) \mod m $$
kde parametry $a,b$ vybíráme náhodně z ${0,\dots, p - 1}$.

**Myšlenka důkazu**
Důkaz nestíváme přímo nad $a$ a $b$, ale převedeme ho na výsledky před modulem $m$. Pro libovolné dva různé prvky $x,y$ definujeme hodnoty $r,s$"
$$
\begin{align}
r = (ax + b) \mod p \\
s = (ay + b) \mod p
\end{align} 
$$

Protože $x \neq y$ a počítme v tělese $\mathbb{Z}_p$ existuje vzájemně jednoznačný vztah mezi $a,b$ a $r,s$. 
- To znamená, že vybírat náhodně $a,b$ je statisticky stejné jako vybírat náhodně $r,s$ z celého prostoru dvojic

**Důkaz**
Chceme dokázat, že pravděpodobnost kolize $h(x) = h(y)$ je $2/m$

1. Kolize nastane, pokud $(r \mod m) = (s \mod m$)
2. Zafixujeme hodnotu $r$. Kolik existuje hodnot $s$, které způsobí kolizi? Jsou to čísla $s$, která mají stejný zbytek po dělení $m$ jako $r$
3. Protože $m \leq p$, můžeme tento výraz odhadnout jako $(p+m−1)/m$
4. Protože $m \leq p$, můžeme výraz odhadnout jako $\leq 2p/m$
5. Pravděpodobnost, že se trefíme do kolizního $s$ je
$$ P_{r=s} = \frac{\# \text{kolizních }s }{p} \leq \frac{2p/m}{p} = \frac{2}{m}$$

**Závěr**
Rodina je 2-univerzální.