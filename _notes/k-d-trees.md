---
references: [https://www.youtube.com/watch?v=Glp7THUpGow, https://mj.ucw.cz/vyuka/dsnotes/07-geom.pdf]
title: "k-d trees"
---
k-d strom je statická binární stromová datová struktura, která se používá na vyhledávání v multidimenzionálním prostoru (porovnává více kritérií) - podobně jako [range tree](/notes/range-tree/)
> [!note] Pozor
> - tato stromová struktura není samovyvažovací (i když existují samovyvažovací verze adaptive k-d trees)
> - často se s ní pracuje tak, že pracujeme nad statickými daty

# Myšlenka
"k" ve názvu k-d trees odkazuje na počet dimenzí (vlastností), se kterými pracujeme.

## Ukázka principu (na dvou dimenzích $x$, $y$)
Takže kořen začne s výběrem jedné z dimenzí (dejme tomu dimenze $x$). Děti tohoto vrcholu budou naopak porovnávat podle dimenze $y$. Takto se alternuje mezi $k$ (v našem případě 2 dimenzemi).

Vizuálně se nad tím dá uvažovat tak, že kořen rozděluje náš k-dimenzionální prostor na dvě půlky v dimenzi $x$. Jeho děti pak rozdělují již přidělenou půlku v dimenzi $y$.

![Image](/assets/img/Pasted image 20260108183444.png)

## Charakteristické vlastnosti
Jelikož se počet bodů snižuje o polovinu v každé hladině, platí že výška stromu je $O(\log n)$, kde $n$ je celkový počet bodů

# Operace
## Build
Pokud pracujeme se statickými daty, můžeme sestavit perfektně vybalancovaný strom, což zaručuje optimální výkon při vyhledávání.

Konstrukce probíhá rekurzivně metodou rozděl a panuj:
1. **Výběr osy:** Zvolíme dimenzi (osu), podle které budeme prostor dělit. Dimenze se v každém patře stromu pravidelně střídají (např. $x→y→z→x→\dots$).
2. **Hledání mediánu:** V aktuální sadě bodů najdeme **medián** vzhledem ke zvolené ose.
3. **Vytvoření uzlu:** Tento medián se stane kořenem (dělicím bodem). Body s menší hodnotou v dané ose jdou do levého podstromu, body s větší hodnotou do pravého.
4. **Rekurze:** Proces opakujeme pro levou a pravou část s nově zvolenou osou, dokud nerozdělíme všechny body.

### Analýza složitosti
- **Časová složitost:** $O(n\log n)$
    - Na každé hladině stromu hledáme medián v čase $O(n)$
    - Jelikož strom pokaždé půlíme, výška stromu je $\log n$.
    - Celkově tedy $O(n)⋅O(\log n)=O(n\log n)$.
        
- **Prostorová složitost:** $O(n)$
    - Potřebujeme uložit všech $n$ bodů (každý uzel stromu odpovídá jednomu bodu).

## Nearest neighbor
Nejužitečnější operace je operace nalezení nejbližšího souseda.

Cílem je najít bod ve stromě, který je nejblíže zadanému bodu $Q$ (query point).

### 1. Průchod dolů (hledání kandidáta)
- Sestupujeme stromem od kořene dolů, jako bychom bod Q chtěli vložit.
- V každém uzlu se podle aktuální dimenze rozhodneme vlevo/vpravo.
- Dojdeme až do listu. Tento list (a body na cestě k němu) považujeme za náš **"aktuálně nejlepší"** (current best) výsledek a vypočítáme jeho vzdálenost $d$.

### 2. Průchod nahoru (rekurze a prořezávání)
Při návratu nahoru po stromě (unwinding) v každém uzlu kontrolujeme:

1. **Je uzel blíž?** Pokud je uzel, kterým se vracíme, blíže k $Q$ než náš "current best", aktualizujeme "current best".
2. **Mám jít do druhé větve?** Musíme zjistit, zda v podstromě, který jsme původně přeskočili, může být bližší bod.
    - **Představa:** Kolem bodu $Q$ opíšeme kružnici (kouli) o poloměru $d$.
    - **Test:** Protíná tato kružnice dělicí rovinu aktuálního uzlu?
        - **ANO:** V druhé větvi může být bližší bod. Musíme ji prohledat rekurzivně.
        - **NE:** Celou druhou větev můžeme ignorovat (prořezávání prostoru).

### Tipy pro efektivitu
- **Kvadratická vzdálenost:** Pro porovnávání se používá $d^2$ (vzdálenost bez odmocniny), je to výpočetně levnější.
- **K-Nearest:** Pokud hledáme k nejbližších bodů, udržujeme si seznam k nejlepších kandidátů a ořezáváme podle vzdálenosti k tomu nejvzdálenějšímu z nich.

## Range search

Cílem je najít všechny body, které leží uvnitř zadaného hyper-boxu (ve 2D případě se jedná o obdelník).

**Princip:** Algoritmus prochází strom a porovnává dotazovaný rozsah s rozsahem (obdélníkem), který reprezentuje aktuální uzel.

- Pokud se rozsahy **nepřekrývají**, celou větev zahodí.
- Pokud rozsah uzlu **zcela leží uvnitř** dotazu, vypíše všechny body v podstromu.
- Pokud se **částečně překrývají**, pokračuje rekurzivně do dětí.

### Časová složitost

Složitost závisí na počtu dimenzí $k$:

1. **Pro $k=2$ (2D strom):** Složitost je $O(\sqrt{n})$.
2. **Pro obecné k:** Složitost je $O(n^{1−1/k}+m)$.

> [!important] "curse of dimensionality"
> Ze vzorce $O(n^{1−1/k}+m)$, s rostoucím počtem dimenzí $k$ se exponent blíží k $1$. To znamená, že ve vysokých dimenzích (např. $100D$) se k-d strom začíná chovat skoro jako lineární vyhledávání $O(n)$ a ztrácí svou výhodu.

#### Vysvětlení časové složitosti
Představ si, že tvůj vyhledávací obdélník je velmi úzký (vypadá jako čára). Chceme spočítat, kolik oblastí (uzlů) taková čára může protnout.

V 2D k-d stromě se dělení střídá: $x,y,x,y…$

- Když rozdělíš prostor podle $x$, tvoje vodorovná čára protne **obě** nově vzniklé oblasti.
- Když v další úrovni rozdělíš prostor podle $y$ (vodorovně), tvoje vodorovná čára protne **pouze jednu** ze dvou oblastí (protože jedna je nad ní a druhá pod ní).

### Intuitivní vysvětlení

1. **Klasický strom (úplné prohledání):** Kdybychom v každém kroku navštívili **oba** syny (všechny podstromy), počet navštívených uzlů by se v každé hladině zdvojnásobil. V hloubce $h$ bychom měli $2h$ uzlů. Jelikož výška stromu je $h=\log_2​n$, celkový počet uzlů je $2^{\log_2 ​n}=n$. (To je lineární průchod).

2. **Náš případ (k-d strom):** My ale nenavštěvujeme oba syny v každém kroku. Děláme to jen v **každém druhém** kroku (jen když řežeme podle osy $x$).
    - Krok $x$: Rozvětvíme se (jdeme do 2 synů).
    - Krok $y$: Nerozvětvíme se (jdeme jen do 1 syna).

**Výsledek:** Efektivně se "rozvětvujeme" (násobíme počet uzlů dvěma) jen v **polovině** případů oproti plnému stromu.

Pokud má strom výšku $h$, my se rozvětvíme jen $\frac{h}{2}$​-krát. Počet navštívených uzlů tedy není $2^h$, ale:
$$2^{h/2}$$
A teď dosadíme za $h$ (výška stromu je $\log_2 n$):
$$2^{\frac{log_2 n}{2}} = (2^{\log_2 n})^{1/2} = n^{1/2} = \sqrt n$$
---
# Dynamické k-d stromy
Standardní k-d strom je skvělý pro statická data (postavíš ho jednou a pak jen hledáš). Pokud do něj ale začneš nekontrolovaně vkládat body, strom se „zkroutí“ a přestane být vyvážený. Tady nastupují [BB(alpha) tree (weight balanced tree)](/notes/bbalpha-tree-weight-balanced-tree/) (Bounded Balance stromy, známé také jako stromy s váhovou vyvážeností).

Místo toho, aby byl k-d strom vyvažován rotacemi, použije se technika **částečného přestavění (partial rebuilding)**.