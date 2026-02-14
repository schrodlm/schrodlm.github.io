---
layout: note
title: "lemma o modulení"
---

**Obecný případ (Lemma M):** Když nevíme nic o velikosti $p$ vs $m$ (jen $p>m$), zhorší se nezávislost faktorem **$4$**. (Typicky se uvádí u lineární kongruence).

**Případ velkého univerza (Lemma K):** Když máme luxus obrovského $p$ ($p≥2km$), zhorší se nezávislost jen faktorem **$2$**. (Typicky u [polynomů](/notes/rodina-polynomialnich-hashovacich-funkci/), nebo optimalizované lineární kongruence).

- $p$ - prvočíslo, které určuje velikost univerza (prvky, které hashujeme)
- $m$ - velikost tabulky v naší hashovací tabulce

---
## Lemma M (composition modulo $m$)
Nechť $\mathcal{H}$ je [(2,c)-nezávislá](/notes/k-nezavislost/) [rodina funkcí](/notes/rodina-hashovacich-funkci/) z univerza $U$ do $[r]$ a nechť $m < r$. Potom rodina funkcí 
$$ \mathcal{H} \mod m=\{h \mod m∣h \in \mathcal{H}\} $$

je $2c$-univerzální a **($2,4c$)-nezávislá** .

---
## Lemma K (k-independent composition modulo $m$)
Silnější tvrzení, ale vyžaduje větší univerzum

**Předpoklad:** 
1. $H$ je (k,c)-nezávislá
2. $r≥2km$ (vnitřní univerzum je mnohem větší než cílová tabulka).

Tvrzení:
$$ \mathcal{H} \mod m$$
je ($k, 2c$)-nezávislá