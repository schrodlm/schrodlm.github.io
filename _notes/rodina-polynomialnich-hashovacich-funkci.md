---
layout: note
title: "Rodina Polynomialnich Hashovacich Funkci"
---

Systém, který slouží pro obecné sestrojení k-nezávislého systému.

# Definice $\mathcal{P}_k$
Mějme těleso $\mathbb{Z}_p^k$ (kde $p$ je prvočíslo) a požadovanou nezávislost $k \geq 1$. Rodina $\mathcal{P}_k$ obsahuje funkce definované vektorem koeficientů $t = (t_0, \dots, t_{k-1} \in \mathbb{Z}_p^k$)

$$ h_t(x) = (\sum_{i=0}^{k-1} t_i x^i \mod p) \mod m$$ 
(Jde tedy o vyhodnocení náhodného polynomu stupně max. $k-1$ v bodě $x$)

### Vztah k [lineární rodině](/notes/rodina-linearnich-hashovacich-funkci/)
Rodina lineárních funkcí ($h(x)=ax+b$) je ve skutečnosti jen **speciálním případem** polynomiální rodiny, kde zvolíme $k=2$.
- **Lineární ($k=2$):** Používáme polynom stupně 1 (přímku). Dva body jednoznačně určují funkci → **2-nezávislost**
- **Polynomiální (obecné k):** Používáme polynom stupně k−1 (křivku). k bodů jednoznačně určuje funkci → **k-nezávislost**
---

## Zdůvodnění k-nezávislosti
Pro důkaz využijeme lemma, které popisuje chování $k$-nezávislosti při redukci univerza modulo $m$.
[lemma o modulení](/notes/lemma-o-moduleni/)

Důkaz provedeme ve dvou krocích, podobně jako u lineární kongruence.

### Krok A: Nezávislost v tělese $\mathbb{Z}_p$ (bez modula $m$)
Nejdříve uvažujeme funkci bez finálního modula $m$:
$$ g_t(x) = \sum_{i=0}^{k-1} t_i x^i (\mod p)$$
Toto je polynom stupně nejvýše $k-1$ nad tělesem $\mathbb{Z}_p$

Zdůvodnění (k,1)-nezávislosti:
1. **Zadání**
Zvolme si libovolných $k$ různých vstupů $x_1, \dots, x_k$ a k nim libovolných $k$ cílových hodnot $y_1, \dots, y_k$ (vše v $\mathbb{Z}_p$)

2. **Otázka**
Jaká je pravděpodobnost, že náhodně vybraný polynom $g_t$ projde všemi těmito body? Tedy platí $g_t(x_j) = y_j$ pro všechna $j=1\dots k$?

3. **Unikátnost (Lagrangeova interpolace)**
Z algebry víme, že $k$ bodů v rovině jednoznačně určuje polynom stupně $k-1$
- 2 body určují přímku
- 3 body určují parabolu
- $k$ bodů určuje křivku stupně $k-1$

4. **Počet možností**
- Celkový počet všech možných polynomů (vektorů $t$) je $p^k$
- Počet polynomů, které procházejí našimi $k$ body je **právě 1**.

5. **Pravděpodobnost**
Šance, že se trefíme do tohoto jediného polynomu je tedy přesně $1/p^k$
- To přesně odpovídá definici ($k,1$)-nezávislosti (pravděpodobnost je součinem pravděpodobností pro $k$ nezávislých jevů: $(1/p)^k$)

### Krok B: Přechod do tabulky (Aplikace Lemmatu K)
Nyní funkci ohneme do velikosti tabulky $m$:
$$ h_t(x) = g_t(x) (\mod m) $$

**Zdůvodnění ($k,2$)-nezávislosti:**
1. Víme, že vnitřní rodina je ($k,1$)-nezávislá (tedy $c=1$)
2. Použijeme Lemma K (o k-nezávislém skládání modulo $m$)
- předpoklad: musíme zvolit prvočíslo $p$ dostatečně velké, konkrétně $p \geq 2km$
3. **Výsledek**
Lemma, říká, že operace modulo $m$ zhorší nezávislost maximálně faktorem $2$. Výsledná rodina je tedy (k,2)-nezávislá

---
