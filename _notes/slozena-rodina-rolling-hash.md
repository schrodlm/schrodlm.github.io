[2-nezávislý](/notes/k-nezavislost/) systém pro hashování řetězců, vzniklý složením [rodina rolling hash](/notes/rodina-rolling-hash/) ($\mathcal{R}$) a [lineární rodiny](/notes/rodina-linearnich-hashovacich-funkci/) ($\mathcal{L}$).


$$ \text{Výsledek} = \underbrace{\text{Lineární}(\underbrace{\text{RollingHash}(\text{Vstup}}_{\text{Krok 1:} \mathcal{R}}}_{\text{Krok 2:}\mathcal{L}}))$$

---
## Princip
> [!note] TL;DR
> Systém $\mathcal{R}$ slouží k tomu, aby **převedl slovo na číslo** (rychle a s možností rolování). Systémy $\mathcal{L}$ nebo $\mathcal{P_k}$​ slouží k tomu, aby toto číslo **bezpečně umístily do tabulky**.

V praxi se tyto systémy často **používají za sebou** jako výrobní linka, abychom dostali to nejlepší z obou světů.

Představte si, že chcete zahashovat slovo **"AHOJ"** do tabulky velikosti $m$.
1. **Krok 1 (Komprese):** Použijete **Rolling Hash (R)**.
    - Vstup: Vektor znaků `['A', 'H', 'O', 'J']`.
    - Akce: Udělá z toho polynom a vyhodnotí ho v náhodném bodě.
    - Výstup: **Jedno velké číslo** v $\mathbb{Z}_p$​ (skalár).
    - _Problém:_ Tento výstup je sice číslo, ale systém $R$ není dostatečně nezávislý (je jen univerzální).
2. **Krok 2 (Míchání):** Vezmete to číslo z kroku 1 a pošlete ho do **Lineární hashovací funkce ($\mathcal{L}$)**.
- Vstup: Číslo z kroku 1.
- Akce: $ax+b(\mod p)(\mod m)$
- Výstup: Index v tabulce $[m]$.
- _Výsledek:_ Díky tomuto kroku získáte požadovanou **2-nezávislost**.

---

## Konstrukce 2-nezávislého systému
Abychom získali systém, který je 2-nezávislý a zároveň má vlastnost rodina rolling hash#Princip rolling window, musíme sestrojit složenou rodinu hashovacích funkcí $\mathcal{H} = \mathcal{R} \circ \ \mathcal{L}$

Tato rodina vzniká složením [rolling hash rodiny](/notes/rodina-rolling-hash/) ($\mathcal{R}$) a [lineární rodiny](/notes/rodina-linearnich-hashovacich-funkci/) ($\mathcal{L}$)

### Parametry a příprava
**Vstup**: Řetězec (vektor) $x$ = ($x_1, x_2, \dots, x_L)$ nad abecedou velikosti $a$. Pokud je řetězec kratší, doplníme ho nulami (padding), přičemž nula nesmí být součástí abecedy.

**Těleso**: Zvolíme dostatečně velké prvočíslo, aby platilo $p \geq 4 Lm$

**Klíč** (náhodné parametry - výběr rodiny):
- $t\in \mathbb{Z}_p$: Náhodný bod pro vyhodnocení polynomu
- $u,v \in \mathbb{Z}_p$: Náhodné koeficienty pro lineární funkci

### Krok 1: Polynomiální komprese (rodina $\mathcal{R}$)
Vektor $x$ interpretujeme jako koeficienty polynomu, který byhodnotíme v bodě $t$. Tím získáme "otisk" řetězce v $\mathbb{Z}_p$:

$$ r = h_t(x) = \sum_{i=0}^{L-1} x_{i+1} \cdot t_i \mod p $$

- $x_i$ - koeficienty
- $t$ - náhodné číslo (proměnná)
- $L$ - délka řetězce

### Krok 2: Lineární míchání (rodina $\mathcal{L}$)
Výsledek $r$ proženeme 2-nezávislou lineární funkcí a mapujeme do cílové tabulky $[m]$:
$$g_{u,v}(r) = ((u \cdot r + v) \mod p ) \mod m $$

### Výsledná funkce
$$ g_{u,v}(r) = ((u \cdot (\sum_{i=0}^{L-1} x_{i+1} \cdot t_i)  + v) \mod p ) \mod m $$
Samotná polynomiální funkce $h_t​(x)$ (krok 1) je pouze **$L$-univerzální** (pravděpodobnost kolize $≤L/p$), ale není nezávislá . Abychom získali 2-nezávislost, musíme ji složit s lineární funkcí, která je (2, 2)-nezávislá (při dostatečně velkém $p$). Podle **Lemmatu o skládání** je výsledná rodina $R∘L$ **2-nezávislá** (konkrétně (2,5/2)-nezávislá pro $p≥4Lm$).

---
## Výhody
Umožňuje přepočítat hash při posunu "okna" v textu v čase $O(1)$, což je klíčové pro algoritmy jako [Rabin-Karp algoritmus](/notes/rabin-karp-algoritmus/) .