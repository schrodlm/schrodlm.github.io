---
layout: note
title: "(a,b) tree"
---

(a,b)-strom je samo-vyvažovací stromová datová struktura.

Od ostatních samo-vyvažovacích stromových struktur se liší tím, že v jednom uzlu může být až $b-1$ klíčů a může mít až $b$ dětí.

![Image](/assets/img/Pasted image 20260105114241.png)

## Invarianty
> [!note] Počet potomků vrcholu
> Kořen stromu má alespoň 2 a nejvýše $b$ potomků. (aby bylo možné strom vůbec iterativně vytvořit)  
> Každý vnitřní vrchol (mimo kořen) má alespoň $a$ a nejvýše $b$ potomků

> [!note] Počet klíčů uzlu
> Počet klíčů v uzlu je vždy o jedna menší než počet dětí, tedy je v intervalu
$$ [a-1, b-1] $$

> [!note]
> Strom je vždy perfektně vyvážený 

## Nutné podmínky
Aby strom vůbec fungoval tak musí splňovat $b >= 2a-1$. Z toho důvodu, že když se nějaký uzel přeplní (overflow), tak se musí rozdělit na dva. Aby tyto dva nové uzly byly platné uzly stromu, musí pro ně platit opět podmínka Počet dětí v uzlu.

## Složitost
(a,b)-strom má **garantovanou logaritmickou výšku**. Základní operace `find`, `insert` i `delete` mají worst-case složitost $O(\log n)$

## Výhody
1. Udržuje data u sebe (proto se používá např. jako struktura u databází)
2. Může být implementován cache-aware, kdy $b$ odpovídá velikosti cache bloku, tím pádem je fetching dat velmi efektivní
3. (a,b)-stromy optimalizují počet I/O operací. Tím, že uzel má velikost diskového bloku, má strom obrovský stupeň větvení ($b$) a tím pádem velmi malou hloubku ($\log_b​n$). To radikálně snižuje počet drahých přístupů do pomalé paměti."

## Nevýhody
1. **Plýtvání pamětí (vnitřní fragmentace)**
- Uzly v (a,b)-stromě nejsou vždy plné.
- Každý uzel (kromě kořene) musí být zaplněn alespoň do poloviny (a dětí), ale může mít až b dětí.
- To znamená, že v průměrném případě je část alokované paměti pro klíče a ukazatele v uzlech nevyužitá (prázdná místa v polích). U B-stromů se uvádí využití paměti typicky kolem 69 % (pro $b=2a−1$).

1. **Režie uvnitř uzlu (node processing overhead)**
- V binárním stromě v každém kroku uděláte jedno porovnání a jdete dál. V (a,b)-stromě musíte v každém uzlu vyhledat správnou větev mezi k klíči.
- To se dělá buď sekvenčně, nebo binárním vyhledáváním uvnitř uzlu. Časová složitost na jeden uzel je tedy $O(\log b)$.
## Overflow a underflow
Při mazání/vkládání klíče může nastat situace, že daný uzel podtéká (nesplňuje $a < \text{deg}(x)$) nebo přetéká (nesplňuje $\text{deg}(x) < b$), k vyřešení tohoto problému slouží operace **split** a **merge**. 

### Split
Rozdělení přeplněného (_overfull_) uzlu (s více než $b$ syny) na dva uzly.
![Image](/assets/img/split.png)

Tento uzel je nutné rozdělit na dva. Díky podmínce $b \ge 2a-1$ mám jistotu, že oba nově vzniklé uzly splňují podmínky stromu. Prostřední klíč původního uzlu přesunu do jeho rodiče a k tomuto klíči připojím oba nové uzly. Pokud dojde k přetečení rodiče, postup opakuji směrem vzhůru, dokud se přetečení nevyřeší nebo nedosáhnu kořene. V případě, že přeteče i kořen, vytvořím nový kořen se dvěma potomky.

### Merge
Sloučení dvou _underfull_ uzlů (s méně než $a$ syny) do jednoho uzlu.
![Image](/assets/img/merge.png)

U merge mohou nastav dvě situace:
##### 1. Případ: Rotace (přesun)
![Image](/assets/img/rotation.png)

**Kdy nastane:** Sourozenec má hodně dětí (více než $a$). To znamená, že nám může jedno dítě (a jeden klíč) darovat, aniž by sám podtekl.

**Jak to proběhne:** Nemůžeme vzít klíč přímo z $v$ do $u$, porušili bychom uspořádání. Musíme to „protočit“ přes rodiče $p$.

1. **Z rodiče dolů:** Klíč z rodiče $p$ (který odděluje $u$ a $v$) se přesune dolů do našeho podtečeného uzlu $u$ (jako největší prvek).
2. **Ze sourozence nahoru:** Nejmenší klíč ze sourozence v se přesune nahoru do rodiče p (na místo toho, co šel dolů).    
3. **Přesun dítěte:** Nejlevější podstrom (dítě) sourozence v se odpojí a připojí se jako nejpravější dítě uzlu u.

**Výsledek:**
- u má nyní a dětí (je opravený).
- v má o jedno méně, ale stále ≥a (je v pořádku).
- Rodič má stejný počet dětí jako předtím.
- **Akce končí**, změna se nešíří nahoru.

##### 2. Případ: Merge (spojení)
![Image](/assets/img/merge.png)
**Kdy nastane:** Sourozenec $v$ má **přesně a** dětí (málo na to, aby dával). Nemůže nám nic dát, protože by sám podtekl. Musíme se tedy sloučit.

**Algoritmus:** Vezmeme obsah $u$, obsah $v$ a klíč z rodiče $p$ a uděláme z nich jeden uzel.
1. **Stáhneme klíč:** Klíč z rodiče $p$ (ten, co odděloval u a v) vezmeme a vložíme ho mezi klíče $u$ a $v$.
2. **Slijeme data:** Všechny klíče a děti z $u$, klíč z rodiče a všechny klíče a děti z $v$ vložíme do jednoho nového uzlu
3. **Úklid:** Uzel v zanikne.
    
**Důležité – co se stalo s rodičem:** Rodič $p$ **přišel o jeden klíč a jedno dítě** (ukazatel). Tím pádem se může stát, že nyní **podteče rodič**.

**Výsledek:**
- Problém se mohl přesunout o patro výš → **Rekurzivně voláme opravu na rodiči.**

## Operace
### `find(x)`
- Začneme v kořeni a postupujeme k listům.
- V každém vnitřním uzlu najdeme interval, do kterého hledaný klíč patří (pomocí lineárního průchodu nebo binárního vyhledávání mezi $a$ až $b$ klíči).
- Podle toho sestoupíme do příslušného syna.
- Hledání končí nalezením prvku nebo zjištěním, že v listu není.
- **Složitost**: $O(\log_a(​n)⋅\log (b))$
### `insert(x)`
- **Vždy vkládáme do listu.**
- Najdeme list, kam klíč patří (pomocí operace `find`).
- Vložíme klíč do listu.
- **Kontrola přetečení:** Pokud má uzel po vložení více než b dětí (resp. b klíčů):
    - **split:** Uzel rozdělíme na dva. Prostřední klíč (medián) pošleme o patro výš do rodiče.
    - Tím se vložení propaguje do rodiče. Pokud i ten přeteče, opakujeme Split rekurzivně nahoru.
- **Kořen:** Pokud se štěpí kořen, vznikne nový kořen (obsahuje 1 klíč a 2 odkazy). Výška stromu roste o 1. Invariant o perfektně vyváženém stromě je zachován.
- **Časová složitost:** Každá operace *split* má časovou složitost $\mathcal{O}(1)$ a může nastat nejvýše $\mathcal{O}(\log n)$-krát, tedy celková časová složitost operace *insert* je $\mathcal{O}(\log n)$.
### `delete(x)`
- **1. Převedení na mazání z listu.**
    - Pokud je mazaný klíč ve vnitřním uzlu, najdeme jeho následníka (nebo předchůdce), který je vždy v listu. Prohodíme jejich hodnoty a následně mažeme onen klíč **z listu**.
- **2. Smazání a kontrola podtečení.**
    - Smažeme klíč z listu.
    - Pokud počet dětí klesne pod $a$, nastalo **podtečení**. Řešíme pomocí operace merge.

- **Kořen:** Pokud z kořene zmizí poslední klíč (byl sloučen s potomky), starý kořen zaniká a sloučený potomek se stává novým kořenem. Výška stromu klesá o 1.
- **Časová složitost:** Každá operace *merge* má časovou složitost $\mathcal{O}(1)$ a může nastat nejvýše $\mathcal{O}(\log n)$-krát, tedy celková časová složitost operace *remove* je $\mathcal{O}(\log n)$.

---

## Hloubka stromu
>[!note]
>(a,b)-strom s $n$ klíči má hloubku $Θ(\log n)$.

### Důkaz
1. Hladina 0 (root): kořen musí mít $\geq 2$ syny
2. Hladina 1: $2$ uzly, každý má minimálně $a$ potomků
3. Hladina 2: $2a$ uzlů, každý má minimálně $a$ potomků
4. Hladina 3: $2a^2$ uzlů, každý má minimálně $a$ potomků
5. ...
6. Hladina $k$: $2a^{k-1}$ uzlů

Listů $l$ v poslední hladině tedy bude $l\geq 2a^{h-1}$

Víme, že klíčů ve jednom vrcholu je minimálně $2a-1$, z toho tedy plyne, že na $i$-té hladině bude ležet $2a^{i-1}\cdot(a-1)$ klíčů, také víme, že na $h$-té (poslední hladině) žádné klíče nejsou. Když sečtu všechny hladiny pak minimální možný počet klíčů $m_h$ v hladině $h$ je:
$$ m_h = 1 + (a-1) \cdot  \sum_{i=1}^{h-1}{2 \cdot a^{i-1}}  = 1 + 2\cdot(a-1) \cdot \sum_{j=0}^{h-2}{a^j}$$

Sumu sečteme jako geometrickou řadu a dostaneme:
$$ m_h = 1 + 2\cdot (a-1) \cdot \frac{a^{h-1}-1}{a-1} = 1 + 2 \cdot (a^{h-1}-1) = 2a^{h-1} - 1 $$

Je tedy vidět, že počet klíčů ve stromě roste s hloubkou exponenciálně. Tedy minimální hloubka pak musí být logaritmická.

---
## Top-down varianta


---

## (a,2a) stromy
[amortizovaná analýza (a,2a-stromů)](/notes/amortizovana-analyza-a2a-stromu.html)

---

## paralelizace (a,b) stromu
[paralelizace (a,b) stromu](/notes/paralelizace-ab-stromu.html)