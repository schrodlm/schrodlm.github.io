---
date: October 18, 2025
title: "left reset turing machine"
---
## 1 Předpoklady

Pracuji s definicí [Turingova stroje](/posts/2024-12-20-turing-machine.html) z přednášky, tedy přechodová funkce je definována:

$$\delta : Q \times \Sigma \rightarrow Q \times \Sigma \times \{R, N, L\}$$

## 2 Idea

Chci ukázat, že nově sestavený [TS'](/posts/2024-12-20-turing-machine.html) s levým resetem a nekončenou páskou zprava dokáže simulovat standardní [TS](/posts/2024-12-20-turing-machine.html).

Potřebuju tedy ukázat:

1. Simulation pohybu doleva pomocí dostupných operací: RESET, RIGHT
2. Simulation nekončené pásky z obou stran pomocí nekončené pásky zprava

## 3 Implementace

### 3.1 Setup

Rozšíříme abecedu původního automatu $\Sigma$ na uspořádanou dvojici, pro kterou platí $\Sigma' = \Sigma \cup \Sigma^\#$, kde # kóduje informaci, na kterém políčku pracovní pásky se nachází simulovaná hlava původního automatu [TS](/posts/2024-12-20-turing-machine.html).

Pro tuto vlastnost platí invariant: **Právě jedno políčko pracovní pásky je označené po a před dokončením simulace operace RIGHT nebo LEFT.** Myšlenka je že i hlava původního automatu [TS](/posts/2024-12-20-turing-machine.html) může být jen na jednom místě v jeden čas.

### 3.2 Simulace pohybů

#### 3.2.1 Simulace RIGHT

Simulation pohybu doprava je jednoduchá. Můžeme předpokládat, že před začátkem této operace je hlava [TS](/posts/2024-12-20-turing-machine.html), právě na jediném symbolu $a \in \Sigma^\#$. Původní jednokroková operace se transformuje na operaci o třech krocích:

1. Přepsání symbolu na nynější pozici hlavy [TS'](/posts/2024-12-20-turing-machine.html) $a^\#$ na $a$[^1]
2. Simulovaný pohyb doprava
3. Přepsání symbolu na nynější pozici hlavy [TS'](/posts/2024-12-20-turing-machine.html) $a$ na $a^\#$

Tímto je simulovaná operace dokončena a invariant stále platí. Složitost této operace je $O(1)$ (s vyšší konstantou) oproti původní $O(\infty)$.

[^1]: operaci si můžeme dovolit díky možnosti pohybu N, kdy automaton může přepisovat znaky na pozici, bez toho aniž by vykonal pohyb doleva nebo doprava

#### 3.2.2 Simulace LEFT

Algorithm pohybu doleva vypadá následovně:

1. Použijeme operaci RESET, čímž se dostaneme na nejlevější políčko pásky.
2. Políčko si označíme symbolem #. Poté znovu provedeme operaci RESET.
3. Posouváme se doprava, dokud nenarazíme na symbol #. Poté se posuneme doprava ještě jednou a nyní nastávají dvě možnosti:
   
   a. **Na této pozici se nachází další #:** Narazili jsme tedy na původní pozici hlavy. Můžeme smazat symbol # a víme, že jediný zbývající # se nyní nachází na pozici jednu vlevo od původní pozice. Hlavou se přesuneme na tuto pozici.
   
   b. **Na této pozici se symbol # nenachází:** Provedeme operaci RESET (v tuto chvíli jsou na pásce tři různé symboly #), poté se posouváme doprava, dokud nenarazíme na první #. Ten smažeme (na pásce zůstávají opět jen dva symboly #) a opakujeme krok 3.

Opět můžeme říct, že invariant po této operaci platí. Složitost této operace je $O(n^2)$ oproti původní $O(1)$.

### 3.3 Jednostranná páska

Kvůli principu operace RESET nemůžeme pracovat s oboustranně nekončenou páskou. Můžeme však její chování simulovat pomocí pásky nekončené pouze směrem doprava.

Vždy, když se nacházíme na nejlevějším políčku pásky a simulovaný automaton provede operaci LEFT, posuneme všechny symboly $a \in \Sigma$ na využívané části pásky o jedno políčko doprava. Principiálně se jedná o operaci RIGHT SHIFT celé pásky. Tím získáme jedno volné místo vlevo od původní pozice hlavy.

Časová složitost této operace je $O(n)$, kde $n$ je počet symbolů na využívané části pásky.

---

## Klíčové pojmy

- [Turing machine](/posts/2024-12-20-turing-machine.html)
- left reset
- simulation
- complexity
- time complexity
- invariant
- infinite tape
- work tape
- tape
- tape head
- alphabet
- automaton
- transition function
- algorithm
- RIGHT SHIFT