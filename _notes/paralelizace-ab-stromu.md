---
layout: note
title: "Paralelizace Ab Stromu"
---

Klíčem k úspěšné paralelizaci je použití metody sliding window v kombinaci s top-down variantou (a,b)-stromů.

### 1. Základní princip: Top-down přístup

Abychom se vyhnuli zamykání celé cesty od kořene k listu (což by zablokovalo celý strom), musíme zajistit, že se **nikdy nebudeme vracet nahoru**.

- U klasických (a,b)-stromů se vkládá do listu a štěpení se propaguje nahoru.
- U paralelní (top-down) verze používáme **preemptivní (preventivní) štěpení**: Při cestě dolů okamžitě štěpíme každý uzel, který je plný. Tím máme jistotu, že až budeme vkládat do listu, nebude potřeba štěpit směrem vzhůru .

---
## Operace
### `insert(x)`
Zamykání funguje na principu posouvání se dolů:

1. **Zámky** 
- Držíme zámek na **aktuálním vrcholu** a jeho **rodiči**.
2. **Akce**
- Zkontrolujeme aktuální uzel. Pokud je plný ($b-1$ klíčů), rozštěpíme ho. Protože držíme zámek na rodiči, můžeme do něj bezpečně vložit klíč.

- Poté odemkneme rodiče.

- Najdeme správného potomka, zamkneme ho a posuneme se dolů (starý "aktuální uzel" se stává novým "rodičem") .

Tímto způsobem je v každém okamžiku zamčena jen malá část stromu a ostatní procesy mohou pracovat v jiných větvích.

### `delete(x)`
Mazání je složitější, protože kromě aktuálního vrcholu a rodiče potřebujeme někdy manipulovat i se **sourozenci** (pro operace sloučení nebo vypůjčení klíče).

**Problém deadlocku:** Pokud procesy zamykají vrcholy v různém pořadí, může dojít k deadlocku. Abychom tomu předešli, musíme definovat **globální uspořádání zámků**:

1. Primárně podle **hloubky** (uzly blíže kořeni mají přednost).
2. Sekundárně (na stejné úrovni) **zleva doprava**.

**Řešení pro sourozence:**
- Pokud jsme v uzlu a zjistíme, že potřebujeme jeho **levého** sourozence, nemůžeme ho jen tak zamknout, protože bychom porušili pravidlo "zleva doprava" (jsme už vpravo).
    
- **Řešení:** Musíme vždy zamknout levého sourozence **předtím**, než vstoupíme do aktuálního uzlu (i když ho možná nebudeme potřebovat), nebo použít složitější mechanismus .
---
### Jak vznikne deadlock

Představme si dva sousední uzly na stejné úrovni:
- **Uzel** $A$ (vlevo)    
- **Uzel** $B$(vpravo)

Běží nám dva procesy (vlákna), $P_1$​ a $P_2$​:

1. **Proces $P_1$​** sestupuje k uzlu $A$. Zamkne si ho, smaže klíč a zjistí, že $A$ podtekl. Chce si půjčit klíč od pravého souseda ($B$).

2. **Proces $P_2$​** ve stejnou chvíli sestupuje k uzlu $B$. Zamkne si ho, smaže klíč a zjistí, že $B$ podtekl. Chce si půjčit klíč od levého souseda ($A$).
    
**Výsledek:**

- $P_1$​ čeká, až $P_2$​ pustí $B$.
- $P_2$​ čeká, až $P_1$​ pustí $A$.

### Odstranění deadlocku (řešení pořadím)

Deadlock vzniká jen tehdy, když existuje **cyklus**. Pokud znemožníme vznik cyklu, znemožníme deadlock.

Toho dosáhneme zavedením **přísného globálního pořadí** zamykání. Pro stromy materiály definují toto pravidlo:
>"Zámky se musí získávat primárně podle hloubky a sekundárně **zleva doprava**."

**Co to znamená v praxi?** Nikdy nesmíte zamknout uzel vpravo a pak žádat o uzel vlevo. Pokud potřebujete pracovat s dvěma uzly, musíte **vždy nejprve zamknout ten levý**.

**Jak to vyřeší náš scénář:**
U ukázky s procesy $P_1$​ (na uzlu $A$) a $P_2$​ (na uzlu $B$).
1. **Proces $P_1$​ (na $A$):**
    - Drží $A$. Potřebuje $B$ (pravý soused).
    - Pořadí "zleva doprava" ($A$ → $B$) je dodrženo. $P_1$​ může požádat o zámek $B$.
        
2. **Proces $P_2$​ (na $B$):**
    - Drží $B$. Zjistí, že potřebuje $A$ (levý soused).
    - **BADABUM BADABAM!** Kdyby teď požádal o $A$, porušil by pravidlo (má pravý, chce levý).
    - Systém/algoritmus musí být navržen tak, aby $P_2$​ věděl, že _pokud_ bude potřebovat $A$, musí si ho zamknout **ještě předtím**, než zamkne $B$.
---
## Shrnutí
Paralelizace (a,b)-stromů pomocí zámků vyžaduje:

1. **fine-grained locking:** Zamykáme jen nejnutnější okolí operace (rodič, uzel, případně sourozenec).
    
2. **top-down strategie:** Operace provádíme jedním průchodem dolů, abychom se nemuseli vracet (a držet zámky).
    
3. **definované pořadí zámků:** Abychom předešli deadlockům při práci se sourozenci.