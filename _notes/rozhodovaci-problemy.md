Rozhodovací problémy jsou **nejjednodušší a nejzákladnější typ výpočetních problémů**. 

Jejich cílem je odpovědět na otázku:
> ANO, nebo NE?

Tedy nevrací hodnotu, strukturu ani slovo — jen informaci, zda vstup splňuje určitou vlastnost.

## Jak se rozhodovací problémy formalizují?
Rozhodovací problém popisujeme jako **jazyk** $L \subseteq \Sigma^*$.

Každé slovo $w \in \Sigma^*$ je možný vstup. Potom:
- pokud $w \in L$, odpověď je ANO
- pokud $w \not \in L$, odpověď je NE

Jazyk je tedy **množina všech vstupů, na které má být odpověď ANO**.

### Proč právě jazyky?

Protože [univerzální turingův stroj](/notes/univerzalni-turinguv-stroj/) pracuje se slovy.  Když tedy chceme popsat, které vstupy má přijmout, nejpřirozenějším modelem je právě „množina slov“.


## Příklady

### IsPrime
**Vstup**: číslo $n$
**Otázka**: „Je $n$ prvočíslo?“
**Jazyk**:
$$L = \{w \mid w \text{ je kód prvočísla}\}$$

### HALT
**Vstup**: $\langle M, w\rangle$