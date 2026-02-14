---
layout: note
title: "vyčíslitelnost"
---

Fundamentální odvětví teoretické informatiky, které se ptá na otázku: "Lze daný problém vůbec vyřešit pomocí algoritmu?"

Vytváří formální podklad toho co je možné vypočítat. **Neřeší paměť ani čas**, ale pouze zda pro daný problém algoritmus vůbec existuje.

## vyčíslitelnost ≠ složitost
**Vyčíslitelnost:** "Existuje *nějaký* algoritmus?" - neřeší efektivitu!
**Složitost:** "Jak efektivní je algoritmus?" - řešíme čas, prostor, optimalizace.

**Příklad:** Sčítání je vyčíslitelné. Můžeme ho implementovat v $O(n)$, ale teoreticky i extrémně pomalu, pro samotnou existenci algoritmu je to jedno.
## Formalizace algoritmu
Musí tedy dát definici toho, co je to vůbec algoritmus. Tento výraz definuje pomocí [výpočetních modelů](/notes/vypocetni-model/).
## Formalizace problému
Pro přesnou matematickou práci je nepraktické mluvit o "problémech" - je to příliš vágní. Podle typu problému můžeme formalizovat pomocí jednoho ze dvou hlavních způsobů:

### 1. [Rozhodovací problémy](/notes/rozhodovaci-problemy/) (jazyky)
Reprezentují se typicky pomocí [jazyků](/notes/formalni-jazyk/)
**Výstup:** ANO/NE
**Formalizace:** Jazyk $L \subseteq \Sigma^*$ je množina slov. Slovo $w ∈ L$ právě když odpověď pro $w$ je ANO. (např. $w \in L_{SUDÉ}$ pokud odpověď na otázku `w % 2 == 0` je ANO )

Vyčíslitelnost je definována pomocí **[rozhodnutelnosti](/notes/rozhodnutelnost/)**.

**Příklad:** $$\text{HALT} = \{⟨M, w⟩ | M \space \text{je TM a M se zastaví na vstupu } w\}$$Tento jazyk není rozhodnutelný. Už z intuice je vidět, že pro libovolný program nemůžeme říct, jestli skončí nebo ne.

### 2. Funkční problémy

**Výstup:** Nějaká hodnota (číslo, slovo, struktura...)

**Formalizace:** [parciální funkce](/notes/parcialni-funkce/) $f: Σ^* \to Σ^*$

**Vyčíslitelnost:** Funkce f je **vyčíslitelná** ⟺ existuje [univerzální turingův stroj](/notes/univerzalni-turinguv-stroj/), který ji počítá.

**Příklad:** $f(a, b) = a + b$ je triviálně vyčíslitelná

### Vztah mezi funkcemi a jazyky
Funkční problémy (výpočet nějaké hodnoty) a rozhodovací problémy (ANO/NE) vypadají na první pohled jako úplně jiné typy úloh.  
V teorii vyčíslitelnosti se ale ukazuje, že mezi nimi existuje úzký vztah — **oba typy problémů lze popsat pomocí Turingových strojů**, a jeden lze převést na druhý.

**Z funkce na jazyk:** $$L_f = \{⟨x, y⟩ | f(x) = y\}$$

Pokud dokážeme rozhodnout, zda dvojice $\langle x, y \rangle$ do tohoto jazyka patří, znamená to, že **umíme ověřit**, zda je $y$ správný výstup funkce.

**Vztah:**
- Pro [totální funkce](/notes/totalni-funkce/): $f$ je vyčíslitelná $⟺$ $L_f$ je rozhodnutelný
	- Pokud existuje algoritmus, který ji počítá, pak existuje i algoritmus, který rozhoduje $L_f$
- Pro [parciální funkce](/notes/parcialni-funkce/): $f$ je vyčíslitelná $⟹$ $L_f$ je rekurzivně spočetný
	- Pak jazyk $L_f$​ nemusí být rozhodnutelný, protože kdykoli je $f(x)$ nedefinovaná, TM by musel říct „NE“ — ale často se místo toho zasekne.

### Funkci nelze implementovat jen rozhodováním!
Pokud máš jen "Je a + b = c?", musíš zkoušet všechna c, což může být **exponenciálně pomalejší** než přímý výpočet.

**Převod je pouze teoretický nástroj, ne praktický způsob výpočtu!**

## Proč se teoreticky pracuje s rozhodovacími problémy?
Proč se využívají rozhodovací problémy pro dokázání vět, ukázání příkladů a obecně výuce vyčíslitelnosti?
1. **Neztrácíme obecnost** - každou funkci lze kódovat jako jazyk
2. **Matematicky jednodušší** - množina slov, známý aparát
3. **Přirozené pro TM** - dva stavy ACCEPT/REJECT
4. **Definovaná hierarchie** - [Chomského hierarchie](/notes/chomskeho-hierarchie/)
5. **Snadné redukce** - pro důkazy nerozhodnutelnosti

Jazyky nejsou omezení, ale praktický a hezký formalismus.