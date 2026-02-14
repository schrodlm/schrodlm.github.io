---
layout: note
title: "hashovací funkce"
---

**Hashovací funkce** je funkce, která mapuje klíče z velkého univerza $U$ do menší množiny indexů ${0, 1, \ldots, m-1}$. Tedy:

$$h: \mathcal{U} \to [m]$$

## Základní vlastnosti

### Ideální hashovací funkce

1. **Rychlý výpočet**: $O(1)$ časová složitost
2. **Uniformní distribuce**: Klíče jsou rovnoměrně rozloženy
3. **Deterministická**: Stejný vstup → stejný výstup
4. **Minimální kolize**: Různé klíče by měly mít různé hashe (pokud možno)

### Kolize

**Kolize** nastává, když $h(x) = h(y)$ pro $x \neq y$.

> [!important] Pigeonhole principle 
> Pokud $|U| > m$, kolize jsou **nevyhnutelné**. Nelze je zcela eliminovat, pouze minimalizovat.

Každá [rodina hashovacích funkcí](/notes/rodina-hashovacich-funkci.html) má definované vlastnosti, které popisují pravděpodobnosti kolize:
[c-univerzálnost](/notes/c-univerzalnost.html)

## Typy hashovacích funkcí

### 1. Division Method (Modulo)

$$ h(x) = x \bmod m $$

- **Výhody**: Velmi rychlá, jednoduchá implementace
- **Nevýhody**: Špatná volba $m$ může vést k mnoha kolizím
- **Doporučení**: $m$ by mělo být prvočíslo daleko od mocnin 2

**Příklad**:

```
m = 13 (prvočíslo)
h(25) = 25 mod 13 = 12
h(38) = 38 mod 13 = 12  ← kolize!
```

### 2. Multiplication Method

$$ h(x) = \lfloor m \cdot ((x \cdot A) \bmod 1) \rfloor $$

kde $A \in (0,1)$ je konstanta (Knuth doporučuje $A \approx \frac{\sqrt{5}-1}{2} \approx 0.618$).

- **Výhody**: $m$ nemusí být speciální hodnota, může být mocnina 2
- **Nevýhody**: Pomalejší než division method

### 3. Polynomiální hashovací funkce
[rodina polynomiálních hashovacích funkcí](/notes/rodina-polynomialnich-hashovacich-funkci.html)

## 4. Rolling hash systém
Slouží k hashování řetězců (nebo vektorů)
[složená rodina rolling hash](/notes/slozena-rodina-rolling-hash.html)