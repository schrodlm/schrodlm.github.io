---
date: October 19, 2025
title: "splay tree empiric experiment"
---
## 1 Introdukce

Tento dokument představuje praktické porovnání dvou implementací [splay tree](/notes/splay-tree.html) stromu:

- **Naivní implementace**, která používá jednoduché rotace pro operaci [splay](/notes/splay-operation.html)
- **Optimalizovaná implementace**, která využívá dvojité rotace

Jako abstraktní jednotku času používáme průměrný počet rotací provedených během [operace splay](/notes/splay-operation.html).

**Důležitá poznámka:** průměrný počet rotací se počítá jen v metodě `find`. Při sestavení stromu pomocí metody `insert` jsou rotace ignorovány.

---

## 2 Sekvenční test

Strom pro tento test je vytvořen tak, že postupně vkládáme prvky 1..n, tedy strom je v tomto případě cesta.

Tento test je zaměřen na vyhledávání prvků ve stromě v podobě sekvenčního růstu.

Pro strom o počtu n prvků provedeme pětkrát sekvenci operací `find` a to v pořadí 1, 2, ..., n.

### 2.1 Hypotéza

Dvojité rotace mají tu vlastnost, že prvky blízko hledaného prvku "posouváme" společně s hledaným prvkem směrem ke kořenu. Pokud tedy hledáme prvky vzestupně (např. v pořadí 1, 2, ..., n), počet operací u optimalizované implementace by měl být konstantní, jelikož se prvky "protřídí" během hledání.

Důvodem je, že se strom během hledání postupně reorganizuje a přizpůsobuje tomuto sekvenčnímu přístupu.

Tato hypotéza je potvrzena teorií v podobě věty od jednoho z autorů [splay tree](/notes/splay-tree.html):

> **Theorem 1 (Tarjan 1985)** Vyhledávání prvků v pořadí 1, 2, ..., n v [splay tree](/notes/splay-tree.html) zabere celkem O(n) času.

Jednoduché rotace tuto vlastnost nemají a ovlivňují jen hledaný prvek. Tedy i při sekvenčním hledání tak zůstávají ostatní prvky hluboko ve stromě (tedy v tomto případě cestě) a počet rotací zůstává závislý na n a to lineární závislostí.

### 2.2 Empirická data

![Figure 1: Porovnání výkonu implementací při sekvenčním vyhledávání](subset_performance_subset10.png)

Z grafu 1 je vidět, že experimentální výsledky odpovídají předpokládanému chování obou implementací a potvrzují moji hypotézu.

---

## 3 Random test

Pro generování náhodného testu byl použit seed `79533111`.

Test spočívá v tom, že na strom o velikosti n, který je vytvořen vložením n prvků v náhodném pořadí, je následně provedeno 5·n operací vyhledávání (`find`), opět na prvích zvolených náhodně.

### 3.1 Hypotéza

Tento test reprezentuje běžné praktické využití stromu, ve kterém není přítomen žádný specifický vzor vkládání ani dotazování na prvky. U [splay tree](/notes/splay-tree.html) využívajícího dvojité rotace lze očekávat [amortizovanou složitost](/notes/amortized-complexity.html) přístupu O(log n), jak uvádí teorie.

V případě implementace [splay tree](/notes/splay-tree.html) pomocí pouze jednoduchých rotací (tzv. naivní implementace) není taková [amortizační záruka](/notes/amortized-analysis.html) známa. Přesto však můžeme empiricky pozorovat očekávanou složitost O(log n). Důvodem je skutečnost, že tato implementace se v podstatě chová jako náhodně vytvořený binární vyhledávací strom (Random BST), jelikož nijak výrazně nemanipuluje se strukturou stromu — kromě přesunutí hledaného (nebo nově vloženého) prvku ke kořeni pomocí jednoduchých rotací.

Je známo, že průměrná hloubka uzlu v náhodně vytvořeném BST s n uzly je O(log n), což bylo dokázáno například v materiálech kurzu CS161 na Stanfordu [Uni23].

S tímto předpokladem tedy mohu říct, že v prostředí s náhodným přístupem budou obě implementace vykazovat logaritmickou složitost vyhledávání O(log n).

Z hlediska počtu rotací na operaci však může být tato single-rotation implementace lepší o konstantu, jelikož při [splay operaci](/notes/splay-operation.html) manipuluje pouze s vyhledávaným uzlem a jeho předky pomocí jednoduchých rotací. Naproti tomu plná implementace s dvojitými rotacemi provádí při každé operaci více zásahů do struktury stromu (např. rotace nad prarodiči), což vede k vyššímu počtu rotací.

### 3.2 Empirická data

Následující graf zobrazuje průměrný počet rotací na [splay operaci](/notes/splay-operation.html) v závislosti na počtu prvků a velikosti subsetu. Osa x je logaritmicky škálována.

![Figure 2: Porovnání výkonu implementací při náhodném vyhledávání](random_graph.png)

Z grafu 2 je vidět, že experimentální výsledky odpovídají předpokládanému chování obou implementací a potvrzují moji hypotézu.

---

## 4 Subset test

Tento test je zřejmě nejsložitější na pochopení (alespoň pro mě zdaleka byl), jelikož kombinuje strukturované i náhodné prvky. Cílem je ověřit, jak si [splay tree](/notes/splay-tree.html) poradí v případě, že je opakovaně dotazována pouze malá podmnožina vstupních prvků, přičemž vstupní data obsahují částečně strukturované (aritmetické) posloupnosti.

### 4.1 Popis testu

Nejprve vytvoříme sekvenci n různých prvků (permutation), které obsahují několik aritmetických posloupností vložených na specifická místa. Tyto posloupnosti vzniknou úpravou pořadí sekvence pomocí pomocné funkce `make_progression`, jejíž princip spočívá v tom, že prvky z daného intervalu [A, B] se přesunou na pozice definované vztahem:

$$\text{pozice} = s + \text{inc} \cdot (x - A)$$

kde x je hodnota prvku, s je výchozí index a inc je krok.

Zbytek prvků zůstává ve vektoru náhodně rozprostřený, čímž vznikne sekvence, která není zcela náhodná, ani plně strukturovaná. Na tuto částečně strukturalizovanou sekvenci se budu odkazovat jako na **seq**.

Jedná se tedy svým způsobem o variantu random test. Pokud bychom nevytvořili žádné aritmetické posloupnosti, jednalo by se čistě o test náhodného přístupu, který je testován v sekci 3.

Po vložení všech prvků do stromu provedeme 10000 volání operace `find`, přičemž každý vybírá náhodný prvek z počáteční části vstupního pole o velikosti **subset**. Tento proces můžeme opakovat pro různé velikosti subsetu.

#### 4.1.1 Vytváření aritmetických posloupností

V sekvenci **seq** se vytvoří následující čtyři aritmetické posloupnosti:

- Interval [n/4, n/4 + n/20] je umístěn do sekvence se vzrůstajícím krokem inc = 1, začína na indexu s = n/10
- Interval [n/2, n/2 + n/20] je vložen sestupně (krok inc = -1), začíná rovněž na indexu s = n/10
- Interval [3n/4, 3n/4 + n/20] je vložen s krokem inc = -4, tedy mezi prvky budou tři náhodné prvky
- Interval [17n/20, 17n/20 + n/20] má krok inc = 5, tedy mezi prvky budou čtyři náhodné prvky

Tímto vzniká sekvence **seq**, která simuluje částečně strukturovaná data a umožňuje sledovat, jak rychle se strom přizpůsobí opakovanému přístupu k malé podmnožině.

#### 4.1.2 Charakteristika testu

V tomto testu je tedy pro každé n (v rozsahu zhruba 256 až 55 000) generována vstupní sekvence **seq** obsahující čtyři aritmetické posloupnosti vložené mezi náhodně rozložené prvky. Každá z těchto posloupností má délku určenou výrazem n//20, tedy pět procent ze všech hodnot. Celkově tak testovaná data obsahují přibližně **20 % prvků**, které tvoří "lokálně seřazené bloky".

Například:
- Pro n = 256 mají posloupnosti rozsahy [64, 76], [128, 140], [192, 204] a [217, 229]. Každá obsahuje 13 prvků, celkem tedy 52 (což je 20,3 % z celku)
- Pro n = 2048: posloupnosti mají délku 103, celkem 412 prvků (přesně 20,1 %)
- Pro největší testované n = 55108: délka každé posloupnosti je 2756, celkem tedy 11024 prvků, což odpovídá přesně 20,0 %

Zbytek pole je tvořen náhodně rozprostřenými prvky, které vytvářejí šum a znemožňují přímou optimalizaci pomocí jednoduchého splayingu.

Tato struktura umožňuje zkoumat chování stromu při opakovaném přístupu pouze k malé, fixní podmnožině prvků (např. subset o velikosti 10, 100, nebo 1000), které mohou, ale nemusí být součástí těchto aritmetických posloupností.

#### 4.1.3 Dotazování na seq

Nyní, když jsme si definovali jakým způsobem se vytváří a jak vypadá, můžeme si nadefinovat jak se na ní budeme dotazovat. Z této sekvence tedy vytvoříme strom pomocí operací `insert`.

Pro každý vytvořený strom, který je definován dvojicí n a **seq** a implementací [operace splay](/notes/splay-operation.html) se provedou testy pro různé velikosti subsetů.

Pro každý tento test se pokusíme 10000x vyhledat v náhodném pořadí pouze prvních **subset** prvků **seq**.

### 4.2 Hypotéza

#### 4.2.1 Předpoklady

Uvažujme [splay tree](/notes/splay-tree.html) obsahující n prvků. Testovací sekvence **seq** má následující vlastnosti:

- 20% prvků v **seq** tvoří strukturované aritmetické progrese
- 80% prvků v **seq** je náhodně rozmístěno
- Dotazujeme se pouze na prvky z prvních **sub** pozic v **seq**
- Pro single-rotation implementaci platí předpoklady random BST z sekce 3.1, tedy operace `find` má složitost O(log n)

#### 4.2.2 Hypotéza 1: Malé subsety (sub ∈ [1, 1000])

**Tvrzení:** Obě implementace se chovají podobně s velmi nízkým počtem rotací na [splay operaci](/notes/splay-operation.html).

**Zdůvodnění:**

Malý hot set rychle migruje k vrcholu stromu do hloubky O(log sub). Opakované přístupy k těmto prvkům je udržují blízko kořene stromu.

- **Single-rotation:** I přes slabší vyvažování stromu stačí několik přístupů k udržení hot set v horních hladinách
- **Double-rotation:** Lepší vyvažování nepřináší výrazný benefit, protože hot set je tak malý, že se vejde do prvních několika hladin stromu
- **Vliv strukturalizace:** Hot set je příliš malý na to, aby pravděpodobnost náhodného výběru sousedních prvků z aritmetické progrese byla významná

**Očekávaný výsledek:** Průměrný počet rotací avg_rot ≈ O(log log n) až O(1) pro opakované přístupy.

#### 4.2.3 Hypotéza 2: Střední subsety (sub ∈ [1000, 2000])

**Tvrzení:** Double-rotation implementace začíná překonávat single-rotation implementaci.

**Zdůvodnění:**

Prostorová lokalita začíná hrát roli. Pravděpodobnost výběru prvku z aritmetické progrese je dána vztahem:

$$P(\text{vybereme prvek z progrese}) = \frac{\text{počet prvků z progrese v prvních sub pozicích}}{\text{sub}}$$

Pro typickou progresi délky n/20 ≈ 5% prvků a sub = 1000 máme přibližně 50 prvků z každé progrese v hot set. Pravděpodobnost přístupu k sousedním prvkům z progrese tedy roste.

**Strukturální výhoda double-rotation:** zig-zig rotation při přístupu k prvku na hloubce d provede O(d) rotací, ale zredukuje hloubku celé cesty na O(d/2). Pro prvky v aritmetické progressi, které jsou v BST "blízko" (např. k, k+1, k+2, ...), double rotation vytvoří kompaktnější podstrom. Naproti tomu single rotation vytváří "zig-chain", která má stále hloubku O(d).

**Hot set přestává být malý:** Množina 1000–2000 prvků se již nevejde do prvních několika hladin stromu. Část hot set je nutně v hloubce Θ(log sub). V tomto bodě začíná záležet na průměrné hloubce prvků, nikoliv pouze na tom, že některé prvky jsou "nahoře".

**Očekávaný výsledek:** Crossover bod, kde double rotation dostihuje a začíná překonávat single-rotation implementaci.

#### 4.2.4 Hypotéza 3: Velké subsety (sub ∈ [2000, 40000])

**Tvrzení:** Double-rotation výrazně překonává single rotation s lepší logaritmickou konstantou.

**Zdůvodnění:**

**[Amortizovaná analýza](/notes/amortized-analysis.html) se projevuje:** Sleator-Tarjan důkaz [amortizované složitosti](/notes/amortized-complexity.html) O(log n) platí pouze pro zig-zig rotation a zig-zag rotation rotace použité v double-rotation implementaci. Pro single rotation tento důkaz neplatí a worst-case complexity je Ω(n). Při velkém hot set se pravděpodobnost výskytu worst-case sekvencí zvyšuje. Navíc, díky vkládání aritmetických posloupností se strom implementovaný pomocí single-rotací více degeneruje a jelikož se nyní hot set častěji nachází v hlubších částech stromu, hraje tato vlastnost single-rotací větší roli.

**Strukturální výhoda škáluje:** Pro velký subset máme vysokou pravděpodobnost přístupu k prvkům z aritmetických sekvencí. Například pro sub = 10000 a n ≈ 65536 (exp = 48):

- Máme přibližně 4 progrese s ~3276 prvky v prvních 10000 pozicích
- P(vybereme prvek z progrese) ≈ 32%

Double-rotation efektivněji přestrukturuje podstromy obsahující tyto sekvence.

**Prevence degenerace:** single rotation při častých přístupech k sekvenci prvků k₁, k₂, k₃, ... z aritmetické progrese vytváří dlouhý řetězec. Double-rotation tento řetězec transformuje do alespoň částečně vyvážených podstromů.

**Matematický model:**

Pro double rotation při přístupu k prvku na hloubce d:
- Provede ≈ d rotací
- Zredukuje hloubku na přibližně d/2 pro celou cestu
- [Amortizovaná](/notes/amortized-complexity.html) cena: O(log n)

Pro single rotation:
- Provede ≈ d rotací
- Zredukuje hloubku pouze pro přistupovaný prvek
- Ve worst-case může stále existovat cesta délky O(n)

**Rozdíl v konstantě:** single rotation ≈ c₁ · log(sub) vs. double rotation ≈ c₂ · log(sub), kde c₂ < c₁.

#### 4.2.5 Závěr

Pozorované chování dává smysl z následujících důvodů:

1. Pro malé subsety je overhead double rotation neznatený – oba přístupy rychle přesunou hot set k vrcholu
2. Pro střední subsety začíná strukturalizace dat hrát roli a pravděpodobnost přístupu k prvkům ze seq roste
3. Pro velké subsety se projevuje teoretická výhoda double rotation jak z hlediska [amortizované složitosti](/notes/amortized-complexity.html), tak z hlediska efektivní práce se strukturovanými daty

Crossover bod okolo sub = 1500 odpovídá momentu, kdy hot set je dostatečně velký na to, aby vyvažování mělo měřitelný efekt, a zároveň pravděpodobnost přístupu ke strukturovaným datům je dostatečná na využití výhod double rotation.

### 4.3 Empirická data

Následující grafy zobrazují průměrný počet rotací na [splay operaci](/notes/splay-operation.html) v závislosti na počtu prvků a velikosti subsetu. Osa x je logaritmicky škálována.

![Figure 3: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 10 v seq](subset_performance_subset10.png)

![Figure 4: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 100 v seq](subset_performance_subset100.png)

![Figure 5: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 1000 v seq](subset_performance_subset1000.png)

![Figure 6: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 1500 v seq](subset_performance_subset1500.png)

![Figure 7: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 2000 v seq](subset_performance_subset2000.png)

![Figure 8: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 4000 v seq](subset_performance_subset4000.png)

![Figure 9: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 5000 v seq](subset_performance_subset5000.png)

![Figure 10: Porovnání výkonu implementací při hledání náhodného prvku v subset o velikosti 10000 v seq](subset_performance_subset10000.png)

---

## References

[Uni23] Stanford University. CS161: Design and analysis of algorithms – section 4 notes, 2023. Accessed October 2025.

---

## Klíčové pojmy

- [splay tree](/notes/splay-tree.html)
- rotation
- [splay operation](/notes/splay-operation.html)
- [amortized analysis](/notes/amortized-analysis.html)
- [amortized complexity](/notes/amortized-complexity.html)
- time complexity
- logarithmic complexity
- binary search tree
- random BST
- tree balancing
- hot set
- arithmetic progression
- splay tree#zig-zag
- splay tree#zig-zig 
- [věta o kompetetivnosti LRU](/notes/veta-o-kompetetivnosti-lru.html)
- worst-case complexity
- spatial locality
- crossover point