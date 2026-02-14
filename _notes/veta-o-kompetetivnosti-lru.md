---
layout: note
title: "věta o kompetetivnosti LRU"
---

Teoreticky je to velmi důležitá věta v rámci [IO modelu](/notes/io-model/), protože dává **formální garanci**, že algoritmus LRU (s $2 \times$ větší velikostí paměti) není v nejhorším případě **neomezeně horší** než optimální strategie, která zná budoucnost.

Bez této věty by totiž mohlo platit, že:

> „Existuje vstupní sekvence, na které má LRU **asymptoticky mnohem horší** počet cache missů než optimální algoritmus.“

Věta o kompetitivnosti říká, že:
- **pro libovolnou sekvenci přístupů** má LRU nejvýše $k \cdot OPT$ cache chyb

> [!important] $k$-kompetitivní
> Této vlastnosti se u cache algoritmů říká $k$-kompetetivnost

---

## Worst-case příklad
Pokud by měly LRU i OPT stejně velkou cache ($M$), LRU může dopadnout katastrofálně.

- **Věta:** Pro libovolnou velikost cache $M$ existuje posloupnost dotazů, kde je počet výpadků LRU (CLRU​) zhruba $M$-krát větší než u OPT.
- **Důkaz:** Uvažujme cyklickou posloupnost bloků $1,2,…,M,M+1$. LRU bude mít výpadek při _každém_ přístupu (protože vždy vyhodí ten blok, který bude následovat v dalším průchodu). OPT naopak vždy vyhodí ten blok, který bude potřeba až za nejdelší dobu, takže bude mít jen jeden výpadek na každých $M$ dotazů .

>[!important]
>Proto se používá tzv. **resource augmentation** (posílení zdrojů) – dáme LRU o něco větší cache než OPT.

## Věta
Věta porovnává počet výpadků LRU s větší pamětí ($M_\text{LRU}$) oproti OPT s menší pamětí ($M_\text{OPT}$)

**Znění věty**
Pro každé $M_\text{LRU} > M_\text{OPT} \leq 1$ a každou sekvenci požadavků platí
$$C_\text{LRU} \leq \frac{M_\text{LRU}}{M_\text{LRU} - M_\text{OPT}} \cdot C_\text{OPT} + M_\text{OPT} $$
- $C_\text{LRU}$ je cena - tedy počet chyb (cache miss), které udělá LRU strategie 

To znamená, že počet výpadků LRU je shora omezen násobkem výpadků OPT plus nějakou aditivní konstantou.
### Důkaz
Cílem je porovnat "hloupou" strategii LRU (která má k dispozici větší paměť $M_\text{LRU}​$) s "božskou" strategií OPT (která má menší paměť $M_\text{OPT}​$).

Předpokládejme, že LRU má dvakrát větší paměť než OPT $(M_\text{LRU}​=2⋅M_\text{OPT}​$).

1. **Rozdělení na epochy**
Celou dlouhou posloupnost přístupů do paměti rozdělíme na menší úseky (epochy)

Epocha končí přesně ve chvíli, kdy strategie LRU nashromáždí $M_\text{LRU}​$ chyb.

2. **Co se dělo v jedné epoše?**
Víme, že LRU udělalo $M_{LRU}$​ chyb. Musíme zjistit, kolik chyb _minimálně_ musel udělat OPT. Máme dvě možnosti, co se mohlo stát (analyzujeme chování LRU):

- **Možnost A: Všechny chyby byly na různé bloky.** Znamená to, že v této epoše se sáhlo na $M_\text{LRU}$​ různých unikátních stránek, které v cache nebyly.
    
    - OPT má paměť jen $M_\text{OPT}$​ (což je polovina z $M_\text{LRU}$).
    - Nemohl mít všechny tyto stránky u sebe. I kdyby měl paměť plnou užitečných dat, stále se mu tam $M_\text{LRU}​−M_\text{OPT}$​ stránek nevejde        
    - **Závěr:** OPT musel mít alespoň $M_\text{LRU}​−M_\text{OPT}​$ chyb .
    
- **Možnost B: LRU chybovalo dvakrát na ten samý blok.** Představte si blok $X$. LRU na něm udělalo chybu $\to$ načetlo ho a dalo ho na pozici "nejnovější". Aby na něm udělalo chybu _znovu_ v té samé epoše, musel ten blok $X$ z cache vypadnout.

	- Aby vypadl z LRU cache (velikosti $M_\text{LRU}$​), muselo přijít $M_\text{LRU}$​ _jiných_ unikátních bloků, které ho vytlačily.
	- Tedy v této epoše se sáhlo na blok $X$ a minimálně $M_\text{LRU}​$ dalších bloků.
    
	- To je dohromady ještě více unikátních bloků než v možnosti A.
    
	- **Závěr:** I zde musel mít OPT (s malou pamětí) alespoň $M_\text{LRU}​−M_\text{OPT}$​ chyb .

3. **Finální srovnání**
V každé epoše platí:
- LRU udělalo $M_\text{LRU}$​ chyb.
- OPT musel udělat alespoň $M_\text{LRU}​−M_\text{OPT}$​ chyb.

Poměr chyb je tedy

$$ \frac{\text{Chyby LRU}}{\text{Chyby OPT}} \leq \frac{M_\text{LRU}}{M_\text{LRU} - M_\text{OPT}}$$
Dosazením $M_\text{LRU} = 2\cdot M_\text{OPT}$ do vzorce pak dostaneme

$$ \text{Faktor} = \frac{2 M_\text{OPT}}{2 M_\text{OPT} - M_\text{OPT}} = 2$$
LRU s dvojnásobnou cache je **2-kompetetivní**. To znamená, že neudělá více než $2\times$ tolik výpadků co optimální strategie (+ zanedbatelná konstanta)

**Praktický význam:** Jelikož asymptotická I/O složitost algoritmů se obvykle nezmění, pokud změníme velikost cache o konstantu (např. ji zdvojnásobíme), můžeme pro analýzu algoritmů předpokládat, že LRU funguje "skoro stejně dobře" jako optimální správce cache.