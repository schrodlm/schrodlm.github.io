---
layout: note
title: "plně náhodná hashovací funkce"
---

**Plně náhodná [hashovací funkce](/notes/hashovaci-funkce/)** (v materiálech označovaná jako _completely random function_) je teoretický ideál, se kterým srovnáváme ostatní reálné hashovací systémy.

Představte si ji takto:

### 1. Definice (Co to je)

Je to funkce $h:U→[m]$, která vznikne tak, že pro **každý** možný vstup $x$ z univerza $U$ hodíme kostkou (vygenerujeme náhodné číslo) a výsledek si zapamatujeme jako $h(x)$.

- **[Nezávislost](/notes/k-nezavislost/):** Hodnota h(x) je zcela nezávislá na hodnotě h(y) pro jakékoliv jiné y.
- **Vlastnost:** Taková funkce je **k-nezávislá pro libovolně velké k** (resp. pro k=∣U∣).
    

### 2. Problém (Proč ji nepoužíváme)

Abychom mohli takovou funkci realizovat v počítači, museli bychom si pamatovat náhodně vygenerovanou hodnotu pro **každý** prvek z univerza.

- Potřebovali bychom **tabulku o velikosti celého univerza ∣U∣**.
- Pokud hashujeme např. 64-bitová čísla, univerzum má velikost 264. Taková tabulka se do paměti nevejde.

### Vztah k ostatním [rodinám](/notes/rodina-hashovacich-funkci/)

Protože plně náhodnou funkci nemůžeme mít, snažíme se jí přiblížit pomocí **rodin hashovacích funkcí** (jako je lineární nebo polynomiální), které:

1. Šetří místo (stačí uložit pár parametrů a,b).
    
2. Zaručují alespoň částečnou náhodnost (např. 2-nezávislost nebo c-univerzalitu).