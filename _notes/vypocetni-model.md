---
layout: note
title: "výpočetní model"
---

Výpočetní model je formální, matematická abstrakce, která definuje jaké základní kroky a pravidla tvoří výpočet.

Je to teoretický "stroj" nebo systém, který nám umožňuje
1. Formalizovat intuitivní pojem "algoritmu"
2. Analyzovat hranice a možnosti tohoto algoritmu

## Síla výpočetního modelu
Ke každému výpočetnímu modelu se vztahuje tzv. **výpočetní síla** - tu se vlastně snaží vyčíslitelnost definovat. 

Ta říká, jakou množinu problémů můžeme pomocí daného modelu řešit. Různé výpočetní modely mají různou výpočetní sílu, můžeme se tedy ptát, jaké problémy lze daným výpočetním modelem řešit.

### Nejsilnější výpočetní model
[Turingův stroj](/notes/turinguv-stroj.html) je považován za model, který definuje hranici algoritmické řešitelnosti.

**Church-Turingova teze:** 
> "Vše, co je intuitivně algoritmicky vyčíslitelné, je vyčíslitelné Turingovým strojem." *Poznámka:* Je to teze, ne věta, tedy není formálně dokázána.

#### Proč ji věříme
Hlavním důvodem je, že všechny jiné pokusy o formalizaci algoritmu se ukázali být **výpočetně ekvivalentní**

- Modely jako lambda kalkul (funkcionální přístup) a částečně rekurzivní funkce (matematicko-logický přístup) mají přesně stejnou výpočetní sílu jako Turingův stroj
- Všechny realističtější modely (programovací jazyky, skutečné počítače) lze simulovat Turingovým strojem

## Komponenty výpočetního modelu
Aby mohl být model použitelný pro teorii vyčíslitelnosti nebo složitosti, musí jasně definovat:
1. **Formát vstupu**: Jak data do modelu vstupují?
2. **Formát výstupu**: Jak model reprezentuje výsledek?
3. **Paměť**: Jak si model ukládá a organizuje data během výpočtu
4. **Sada atomických operací**: Základní **nedělitelné** kroky, které umí model provést
	- např. [Turingův stroj](/notes/turinguv-stroj.html): Přečti symbol, zapiš symbol, posuň hlavu doleva/doprava
5. **Řízení**: Mechanismus, který rozhoduje, jaká operace se provede jako další, v závislosti na aktuálním stavu a datech


## Proč existuje více výpočetních modelů
Různé modely se hodí k různým účelům:
1. Konečné automaty
	- jsou záměrně velmi výpočetně slabé (nemají stavy ani paměť)
	- ideální pro rozpoznávání jednoduchých vzorů a ukazují nejnižší třídu výpočetní síly
2. [Turingův stroj](/notes/univerzalni-turinguv-stroj.html)
	- záměrně velmi jednoduché, ale maximálně silné
	- ideální pro zkoumání hranic vyčíslitelnosti
	- co nedokáže spočítat TS (pravděpodobně) nejde algoritmicky vůbec
3. RAM (random access machine
	- záměrně se složitostí operací přibližují reálnému CPU
	- jsou ideální pro analýzu složitosti algoritmů