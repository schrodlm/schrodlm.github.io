---
layout: note
title: "BB(alpha) tree (weight balanced tree)"
---

# Definice a princip
Na rozdíl od AVL stromů, které hlídají **výšku** podstromů, BB(alpha)-stromy hlídají **váhu (počet uzlů)** v podstromech.

## Podmínka BB(alpha)
Mějme parametr $\alpha$, což je číslo v rozsahu $0<\alpha \leq \frac{1}{2}$ (typicky např. $\frac{1}{3}$ nebo $\frac{1}{4}$). 
- Uzel $v$ je **váhově vyvážený**, pokud pro počet uzlů v jeho levém ($w_L$​) a pravém ($w_R$​) podstromu platí, že žádný z nich není "příliš lehký" (a tím pádem druhý "příliš těžký") vzhledem k celkové váze $w=w_L​+w_R​+1$.

Formálně musí pro každý uzel platit:
$$
\begin{align}
\alpha \leq \frac{w(v\text{.left})}{w(v)} \leq (1 - \alpha) \\
\alpha \leq \frac{w(v\text{.right})}{w(v)} \leq (1 - \alpha)\\
\end{align}
$$

Jednoduše řečeno: **Ani jeden syn nesmí mít méně než $\alpha$-podíl všech potomků.**

---
### Líné vyvažování (lazy re-balancing)

Klasické BB(alpha) stromy mohou používat rotace. Ale varianta s **líným vyvažováním** (často pod názvem _scapegoat trees_) funguje jinak. Nepoužívá rotace.

**Jak to funguje:**
1. **Vkládání (`insert`):** Vložíme prvek jako do běžného binárního stromu. Cestou dolů si neukládáme balanční faktory.
2. **Kontrola:** Po vložení zkontrolujeme, zda strom není příliš hluboký nebo zda nebyla porušena podmínka $\alpha$-vyváženosti někde na cestě k novému uzlu.
3. **Scapegoat:** Pokud je podmínka porušena, najdeme nejvyšší uzel na cestě vložení, který není v rovnováze (jeden jeho syn je moc těžký). Tento uzel je "scapegoat".
4. **Přestavba (rebuild):** Celý podstrom s kořenem v obětním beránkovi vezmeme, "zbouráme" ho (převedeme na seřazené pole) a znovu ho postavíme jako **dokonale vyvážený** strom.
    
Tato operace je "líná", protože většinu času nic neděláme. Jen občas, když se strom hodně vychýlí, provedeme drahou, ale dokonalou opravu.

---
## Amortizovaná analýza složitosti
Toto je klíčová část. Proč je to efektivní, když přestavba podstromu velikosti k trvá $O(k)$?

**Tvrzení:** Vkládání (`insert`) má [amortizovanou složitost](/notes/amortized-complexity.html) $O(\log n)$.

**Důkaz (intuitivní, pomocí kreditů):** Představte si, že jsme právě přestavěli podstrom o velikosti $m$. Je nyní **dokonale vyvážený**.

- Aby se tento podstrom stal znovu nevyváženým (porušil podmínku $\alpha$), musíme do jedné jeho větve vložit hodně prvků.

- Konkrétně, aby podstrom přestal splňovat podmínku $\alpha$, **musíme provést řádově $\Omega (m)$ vložení od poslední přestavby.**

Použijme **Bankéřovu metodu**:
1. Každé vložení stojí reálně $O(1)$ (plus cesta $O(\log n)$).
2. Při každém vložení zaplatíme extra "daň" (kredit), který uložíme k uzlu, kterým procházíme.
3. Když nastane čas na přestavbu podstromu velikosti $m$, máme u něj nastřádáno dostatek kreditů (protože jsme museli provést hodně vložení, aby se vyváženost pokazila), které zaplatí cenu přestavby $O(m)$

Díky tomu je průměrná cena vložení jen logaritmická, i když v nejhorším případě (kdy přestavujeme celý strom) trvá $O(n)$.

**Shrnutí složitosti:**
- **Search (Hledání):** $O(\log n)$ v nejhorším případě (výška je garantována $\alpha$ podmínkou).
- **Insert/Delete:** $O(\log n)$ **amortizovaně**.

---
## Využití
BB(alpha) stromy s líným vyvažováním (přestavbou) se používají tam, kde **nelze použít rotace**.

Typický příklad jsou [k-d trees](/notes/k-d-trees.html), v k-d stromech se prostor dělí střídavě podle k-souřadnic.

- Pokud byste v k-d stromu chtěli udělat klasickou rotaci (jako v AVL), **zničili byste geometrickou strukturu** dělení prostoru (invariant, že vlevo jsou menší X a vpravo větší X, by po rotaci nemusel platit pro jinou hladinu, kde se dělí podle Y).
- Proto se u k-d stromů používá **váhové vyvažování s přestavbou**. Když se jedna větev stane příliš těžkou (obsahuje moc bodů v daném výřezu prostoru), celý tento podstrom se smaže a znovu postaví dokonale vyváženě.

### Další použití
- v systémech, kde čtení drtivě převažuje nad zápisem
- funkcionální datové struktury (kde se stromy kopírují a rotace jsou drahé nebo složité na implementaci).