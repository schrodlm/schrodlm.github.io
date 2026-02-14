---
layout: note
title: "rodina rolling hash"
---

**Vstup (Data):** Koeficienty polynomu (znaky řetězce $x_1​,x_2​,…,x_L$). 
**Náhodný klíč:** Bod $a$ (ve kterém polynom vyhodnocujeme)
> [!important] Co to znamená
> rolling hash systém je **odlišný v tom, co zpracovává**, ačkoliv matematický vzorec vypadá skoro stejně jako u [rodina polynomiálních hashovacích funkcí](/notes/rodina-polynomialnich-hashovacich-funkci/) 

**Definice funkce** (vyhodnocení polynomu v bodě $a$):
$$ h_a(x) = \sigma_1 a^{d-1} + \sigma_2 a^{d-2} + \dots + \sigma_{d-1} a^{1} + \sigma_d a^0  \mod p$$
>[!note]
>Znaky řetězce ($\sigma_i$) zde hrají roli koeficientů polynomu náhodný klíč (a) hraje roli neznámé $x$. (obráceně než u [rodina polynomiálních hashovacích funkcí](/notes/rodina-polynomialnich-hashovacich-funkci/))

---

## Princip rolling window
Představme si, že máme text (kupku sena) a posouváme po něm okno o velikosti $d$.
- **Aktuální okno (pozice j):** Obsahuje znaky $σ_j​,σ_j+1​,…,σ_j+d−1$​.
- **Nové okno (pozice j+1):** Posuneme se o jedno doprava. Zmizí $σ_j$​ a přibude $σ_j+d$.

Chceme vypočítat nový hash $H_{j+1}$ z toho starého v čase $O(1)$, aniž bychom museli znovu procházet celým oknem.

### Matematické odvození posunu
1. Starý hash ($H_j$)
$$ H_j = \sigma_j a^{d-1} + \sigma_ja^{d-2} + \dots + \sigma_{j+d-1} a^{0} \mod p$$

2. **Krok 1: Odstranění starého znaku ($σ_j$​)** 
Nejvyšší mocnina u prvního znaku je $a^{d−1}$. Musíme tento člen odečíst. Ale pozor, nemůžeme ho jen tak škrtnout, je součástí součtu. Využijeme triku s násobením. 

Když vynásobíme celý starý hash číslem a (posuneme mocniny o jedna výš), dostaneme:
$$ a \cdot H_j = \sigma_j a^{d} + \sigma_j a^{d-1} + \dots + \sigma_{j+d-1} a^{1} \mod p $$
3. **Krok 2: Odříznutí přečnívajícího členu** 
Teď nám na začátku přebývá člen $σj_​a^d$. Ten odečteme:
 $$ (a \cdot H_j) - \sigma_j a^d = \sigma_j a^{d-1} + \dots + \sigma_{j+d-1} a^{1} \mod p $$
 pozn. Zbytek řady už vypadá skoro jako nové okno, jen mu chybí poslední člen $a^0$

**Krok 3: Přidání nového znaku ($σ_{j+d}$​)** Nakonec přičteme nový znak, který má mít mocninu $a^0$ (tedy 1):
$$ H_{j+1} = \underbrace{(a \cdot H_j - \sigma_j a^d)}_{\text{posunuto a odžíznuto}} + \sigma_{j+d}$$

Výsledný vzorec pro $O(1)$ update:
$$H_{j+1} = (H_j \cdot a - \sigma_j \cdot a^d + \sigma_{j+d}) (\mod p)$$

> [!note] Proč tímto způsobem
> **Výhoda tohoto specifického tvaru (Hornerovo schéma):** Všimněte si, že jsme použili mocniny klesající zleva doprava ($a_{d−1}…a_0$). Díky tomu odpovídá operace posunu okna **násobení** základem a (což je levné). 
> Kdybychom měli mocniny opačně ($a0…a_{d−1}$), museli bychom při posunu **dělit** základem a (násobit modulární inverzí), což je výpočetně náročnější. Proto se pro rolling hash používá tato varianta.

---
## [k-nezávislost](/notes/k-nezavislost/)
**Vlastnost:** Sám o sobě je pouze **[univerzální](/notes/c-univerzalnost/)** (pravděpodobnost kolize $L/p$), ale **není nezávislý**.
