---
layout: note
title: "LCP array"
---


## Využití se suffixovým polem
Samotné pole S stačí na jednoduché věci (např. vyhledání výskytu vzorku v textu pomocí binárního vyhledávání ). Ale pro složitější úlohy (hledání nejdelšího společného podřetězce, komprese, histogramy k-gramů) je samotné seřazení málo – potřebujeme vědět, kde se suffixy shodují. Proto se v praxi téměř vždy po S staví i L.

## Konstrukce (Kasaiův algoritmus)
>[!note] **Předpoklad**
> - K sestrojení LCP pole efektivně potřebujeme mít hotové [suffixové pole](/notes/suffix-array/) $S$.
> - Předpokládáme tedy sestavené suffixové pole (např. podle suffix array#Konstrukce (algoritmus zdvojování))

> Naivní konstrukce by trvala $O(n^2)$. Každý suffix (celkem $n$) lineárně porovnat s $i+1$-tým suffixem.

**Hlavní myšlenka:** Algoritmus využívá faktu, že LCP hodnoty klesají pomalu. Pokud suffix začínající na $i$ má s někým shodu délky $k$, pak suffix začínající o pozici dál ($i+1$) bude mít shodu minimálně $k−1$. Jednoduše proto, že jsme jen "odřízli" první písmeno.

### Postup
1. Procházíme suffixy v původním pořadí textu (ne podle $S$, ale pomocí $i=0,1,\dots, n−1$).
2. Udržujeme si proměnnou $k$ (aktuální délka shody)
3. V každém kroku snížíme $k$ o $1$ (pokud není $0$) a zkoušíme prodloužit porovnáváním znaků od $k$-tého indexu (protože víme, že $k$ prvních znaků se shoduje)

### Analýza složitosti
> [!note] Amortizovaná analýza
>  Jde vidět, že v implementaci budou dva `for` loopy, což typicky znamená $O(n^2)$ časovou složitost
>  Pro dokázání, že algoritmus opradu běží v čase $O(n)$, musíme využít [amortizovanou analýzu](/notes/amortized-analysis/)
 
Proměnná $k$ se může zvýšit (operace uvnitř `while`) celkem maximálně $2n$-krát za běh celého programu. Protože operací "mimo `while`" je $n$ a operací "uvnitř `while`" je maximálně $2n$, celková složitost je $O(3n)$, což je $O(n)$.

Pro formální důkaz by se použila [metoda potenciálu](/notes/potential-method/)