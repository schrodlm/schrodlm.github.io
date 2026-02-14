---
layout: note
title: "bloom filter"
---

Bloomův filtr je **pravděpodobnostní datová struktura**, která slouží k paměťově velmi úsporné reprezentaci množiny prvků. Umožňuje provádět dvě operace:
- `insert`: Vložit prvek do množiny.
- `find` (query): Zjistit, zda prvek v množině je.

## Klíčová vlastnost
Odpověď na doraz (`find`) není vždy 100% přesná:
- **no false negative**: Nikdy se nemýlí v negativní odpovědi. Pokud filtr nenajde prvek, určitě tam není
- **false positives**: Pokud filtr prvek najde, pravděpodobně tam je, ale může jít o omyl

>[!important] Mazání
>Standardní Bloomův filtr **neumožňuje mazání**.
---

## Algoritmus
**Struktura**
Máme pole $m$ bitů ($B[0…m−1]$), které jsou na začátku všechny nastaveny na $0$. Máme $k$ [nezávislých](/notes/k-nezavislost/) [hashovacích funkcí](/notes/hashovaci-funkce/) $h_1​,…,h_k​$, které mapují univerzum do rozsahu $[m]$.

**`insert(x)`**
Pro vkládaný prvek $x$ spočítáme všech $k$ hashovacích hodnot $h_1(x), \dots, h_k(x)$. V poli $B$ nastavíme bity na těchto indexech na 1.

**`find(x)`**
Opět spočítáme $h_1(x), \dots, h_k(x)$ a podíváme se do pole $B$.
- Pokud je každý z těchto bitů $=1$, odpovíme ano (prvek tam asi je)
- Pokud je alespoň jeden z těchto bitů $=0$, odpovíme NE (prvek tam určitě není)

---
## Analýza

### Jaká je šance, že se trefím do obsazeného místa?

**1 krok: Jaká je šance, že bit zůstane 0?**
Máme $n$ prvků a hashujeme $k$ funkcemi. Celkem tedy nastavíme $kn$ bitů.

- Šance, že jednou šipkou trefím do konkrétního bitu je $1/m$
- Šance, že se do něj netrefím je $1 - 1/m$
- Aby bit zůstal prázdný ($0$), musím se do něj netrefit ani jednou ze všech $kn$ pokusů

Pravděpodobnost, že bit je $0$ ($P_0$) je tedy:
$$ P_0 = (1-\frac{1}{m})^{kn}$$

V matematice platí známá limita pro velká čísla: $(1-1/m)^m \approx 1/e$ . Tento vzorec tedy můžeme upravit jako:
$$P_0 =((1-1/m)^m)^{\frac{kn}{m}} \approx e^{-\frac{kn}{m}}$$
Zaplnění závisí na poměru počtu hodů ($kn$) a velikost tabulky $m$

**2.krok: Jaká je šance na false positive?**
false positive nastane, když se ptáme na prvek $Y$ (který v množině není), ale filtr nám řekne ANO. TO se stane, pokud všech $k$ funkcí pro prvek $Y$ dopadne do již nastavených bitů.

- pravděpodobnost, že bit je $1$, je prostě opak toho, že je $0$:
$$ P_1 = 1-P_0$$
- Aby nastala chyba, musíme mít smůlu $k$-krát za sebou (všech $k$ hashů trefilo jedničku:)
$$P_\text{chyba} = (P_1)^k = (1-P_0)^k$$
Dosadíme náš odhad z kroku 1:
$$P_\text{chyba} \approx (1-e^{-\frac{kn}{m}})^k$$

**3.krok: Intuitivní optimalizace (pravidlo 50%)**
> [!note] Poznámka
> Tady je důležité si uvědomit, že bloom filtry se většinou vytvářejí nad statickými daty, takže $n$ je dané a $m$ je nějaká zeshora omezená paměť (RAM). Abychom tedy tabulku co nejvíce využili musíme zvolit optimální $k$

Teď přichází ta nejdůležitější myšlenka.

Kdy nese pole nejvíc informace?
1. Když je skoro prázdné (samé 0): Plýtváme místem. Hashovacích funkcí ($k$) je málo
2. Když je skoro plně (samé 1): Všechno koliduje. Každý dotaz vrátí "ANO". Hashovacích funkcí ($k$) je moc.

Filtr funguje nejlépe, když je v poli zhruba stejný počet nul a jedniček (balanc mezi počtem uložených informací a pravděpodobností false positive). Pravděpodobnost, že bit je nula, by měla být $1/2$.

Pokud dosadíme tuto logickou úvahu ($P_0 = 1/2$) do rovnice z kroku 1:
$$ e^{- \frac{kn}{m}} = \frac{1}{2}$$
Zlogaritmujeme (přirozený logaritmus $ln$):
$$
\begin{align}
-\frac{kn}{m} &= \ln(1/2) = -\ln 2 \\
\frac{kn}{m} &= \ln 2
\end{align}
$$

Z toho jednoduše vyjádříme optimální počet hashovacích funkcí $k$:
$$k=\frac{m}{n} \cdot \ln 2 \approx 0.7 \cdot \frac{m}{n}$$

---
### Příklad praktického použití

Typické použití je jako **rychlý filtr před náročnou operací**. Chceme rychle vyloučit prvky, které "určitě neexistují", abychom nemuseli sahat na pomalý disk nebo do sítě.

**Příklad: Detekce škodlivých URL (webový prohlížeč)** Prohlížeč chce zkontrolovat, zda URL adresa, kterou uživatel navštívil, není na seznamu známých škodlivých stránek.

1. Seznam škodlivých stránek je obrovský (miliony), stahovat ho celý do paměti uživatele je neefektivní.
2. Prohlížeč si stáhne pouze **kompaktní Bloomův filtr** reprezentující tento seznam.
3. Při návštěvě stránky se prohlížeč zeptá filtru:
    - **Odpověď NE:** Stránka je bezpečná (určitě není na seznamu). → Rychlé, bez sítě.
    - **Odpověď ANO:** Stránka je _asi_ škodlivá. → Prohlížeč pošle dotaz na server (pomalé), aby to ověřil na 100 %. _(V tomto případě nevadí malé % falešných pozitiv, protože se jen provede zbytečný dotaz na server, ale uživatel není ohrožen falešným negativem)_.