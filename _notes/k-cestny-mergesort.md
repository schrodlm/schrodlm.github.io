---
layout: note
title: "k-cestný mergesort"
---

## Princip

Klasický mergesort slučuje vždy 2 běhy dohromady. k-cestný mergesort slučuje najednou **k běhů**.

- **Snížení počtu průchodů**
Sloučením K běhů v každém kroku se snižuje celkový počet průchodů daty z $\log n$ na $⌈\log_k n⌉=⌈\frac{\log n} {\log k}​⌉$.
- **Použití haldy**
Pro efektivní nalezení minima z $k$ prvků se používá heap. Časová složitost jednoho kroku je $O(\log k)$
- **Celková časová složitost**
Celková časové složitost zůstává $O(n \log n)$, stejně jako u klasického mergesortu protože $\frac{\log n}{\log k} \cdot n \log k = n \log n$

## Analýza složitost (cache aware)
V tomto modelu předpokládáme, že známe velikost cache $M$ a velikost bloku $B$.

**Složitost jednoho průchodu**:
- Během jednoho průchodu slučujeme všechny běhy
- Protože jsou běhy uloženy sekvenčně, čtení vstupních dat i zápis výstupních dat probíhá velmi efektivně
- Celkový počet I/O operací pro jeden průchod přes $n$ prvků je $O(\frac{N}{B} + 1)$
	- pozn. Předpokládáme, že máme dostatečně velkou cache na to abychom z $K$ vstupních běhů i pro výstupní běh měli alokovaný alespoň jeden blok
- Celková IO složitost: Celkovou složitost získáme vynásobením ceny jednoho průchodu počtem průchodů
$$ 
\begin{align}
I/O &\approx \text{Počet průchodů} \times \text{Cena průchodu} \\
I/O &\in O(\frac{n}{B} \cdot \log_k n + 1) = O(\frac{n}{B} \cdot \frac{\log n}{\log k} + 1)
\end{align}
$$

**Omezení velikost $k$**
Nemůžeme zvolit $k$ libovolně velké, protože jsme limitováni velikostí cache $M$. Aby algoritmus fungoval efektivně (bez cache trashing), musí se do cache vejít:
1. **Vstupní buffery**: 1 blok pro každý z $k$ slučovaných běhů
2. **Výstupní buffer**: 1 blok pro zapisovaný výsledek
	- Celkem tedy $k + 1$ bloků pro IO
3. **Halda**: Halda pro $k$ prvků se taky musí vejít do cache. Tedy $k-1$ bloků.
**Podmínka pro cache:** Materiály uvádějí, že postačující podmínka pro to, aby se vše vešlo, je:
$$ M \geq 2B\cdot k$$
>[!note] Proč?
>- při k-cestném slučování čteme data z k různých seřazených posloupností (runs) a zapisujeme do jedné výsledné.
> - pak 1 blok na zápis výstupu
> - a halda si vezme k-1 bloků (to je hodně štědrý, asi by jí stačilo mnohem méně, ale nám to pak dá hezky $2k$ bloků) 
>
> Díky této podmínce pak nebude probíhat cache thrashing


- Aby čtení nebylo pomalé, musíme mít pro **každý** z k vstupních proudů načtený alespoň **jeden blok** v cache.
### Optimální volba $k$

Naším cílem je minimalizovat celkovou I/O složitost. Z vzorce $O(\frac{n}{B} \cdot \frac{\log n}{\log k})$ vyplývá, že musíme **maximalizovat $k$** (aby jmenovatel $\log k$ byl co největší).

Maximální možné $k$, které splňuje podmínku $M \geq 2B\cdot k$, je:
$$  k=⌊\frac{M}{2B}​⌋ $$

**Výsledná optimální složitost**
Pokud dosadíme toto optimální $k \approx M/B$ do vzorce pro složitost, dostaneme
$$ I/O \in O(\frac{n}{B} \cdot \frac{\log n}{\log (M/B)} + 1) $$

**Závěr**
Tato složitost je optimální pro řazení v externí paměti. Existuje dolní odhad, který dokazuje, že lépe to udělat nelze.