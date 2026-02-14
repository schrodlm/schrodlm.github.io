---
layout: note
title: "linear probing"
---

 Jde o metodu otevřená adresace u [hashovacích funkcí](/notes/hashovaci-funkce/).

Všechny prvky jsou uloženy přímo v poli o velikosti $m$ (narozdíl od hash chaining).

## Myšlenka
Kolize v tabulce se řeší postupným prohledáváním:
$$ h(k,i) = (h(k) + i) \mod m $$

## Operace

### `insert()`
Pokud chceme vložit prvek $x$, zkusíme index $i = h(x)$. Pokud je obsazený, zkusíme $i+1$, pak $i+2$, atd., dokud nenajdeme volné místo

### `find()`
Stejně jak procházíme pole od $h(x)$, dokud nenajdeme prvek nebo nenarazíme na prázdné políčko

### `delete()`
Nemůžeme prvek jen smazat, protože bychom "přerušili" cestu k prvkům za ním. Používají se "náhrobky" (které implikují, že prvek byl smazán), nebo přehashování


## Výhody
- porovnávám proti datové struktuře implementující hash chaining (obě jsou to metody hashování)
1. **Cache locality** (nejdůležitější)
Linear Probing čte paměť sekvenčně. To je pro procesor efektivní, protože si paměť načítá po cache blocích

2. **Jednoduché počítání**
Jednoduchý výpočet další pozice.

3. **Žádná paměťová režie**
Nepotřebujeme ukládat pointery na další prvek

## Nevýhody
1. **Shlukování** (clustering)
- vznikají dlouhé souvislé bloky obsazených polí
Výrazně se zhoršuje výkon při vyšším zaplnění tabulky

2. **Rychlý pokles výkonu s rostoucím zaplněním**
Už při load factor $> 0.7$ rychle roste počet průměrných probů
- to znamená, že vyžaduje častější rehashing

2. **Mazání (tombstones)**
Je zde nutnost využívat tombstones, takže i při iterativním mazání prvky se nezlepší shluk

## Analýza
Analýza je poměrné složitá. Důležitá je myšlenka, že pokud je tabulka zaplněná poměrně málo (kolem $n \leq m/3$), je očekávaný počet kroků konstantní.

### Předpoklady analýzy
- máme plně náhodnou hashovací funkci (každý prvek jde náhodně kamkoliv)
- počet prvků $n \leq m/3$ (load factor $\alpha \leq 1/3$)
- velikost tabulky $m$ je mocnina dvojky (zjednodušení důkazu)

### TL;DR
**Lidské shrnutí:**
> "Abychom dokázali $O(1)$, musíme vyloučit existenci dlouhých shluků. Použijeme myšlenkový model **stromu intervalů**, abychom zachytili přeplněná místa různých velikostí. Takovému přeplněnému místu říkáme **kritický blok** (je v něm $2×$ víc prvků, než má být). Pomocí **Chernoffovy meze** dokážeme, že pravděpodobnost vzniku velkého kritického bloku je mizivá (exponenciálně malá). Protože pravděpodobnost velkých shluků klesá tak rychle, průměrná délka shluku pak konverguje ke konstantě"

### Myšlenka analýzy
Linear probing trpí na vytváření tkzv. shluků (runs) - souvislých bloků obsazených políček. Pokud se trefíme do shluku, musíme ho celý projít. Cílem je dokázat, že **dlouhé shluky jsou extrémně nepravděpodobné**.

1. **Hierarchie bloků**
Představme si tabulku velikosti m (kde $m$ je mocnina dvojky - pro jednoduší analýzu). Rozdělíme ji hierarchicky na **bloky**:

- **Hladina 0:** Celá tabulka (velikost m).
- **Hladina 1:** Dvě poloviny (velikost m/2).
- **Hladina 2:** Čtyři čtvrtiny (velikost m/4).
- ...
- **Hladina $\log m$:** Jednotlivé buňky (velikost 1).

> [!note] **K čemu to je** 
> Místo abychom zkoumali všechny možné intervaly, budeme zkoumat jen tyto "zarovnané" bloky. 
> 
> Základní myšlenka důkazu zní: **Pokud v tabulce existuje dlouhý shluk (run), musí někde existovat blok z tohoto stromu, který je "přeplněný"(kritický).**

2. **Kritický blok**
Máme blok $B$ o velikosti $2^t$ (např. 16 políček).
- **Očekávání**: Jelikož je tabulka zaplněná jen z $1/3 (n=m/3)$ očekáváme, že se do tohoto bloku hashovací funkce pošle průměrně $\frac{1}{3} \cdot 2^t$ prvků (cca. 5)
- **Definice kritického bloku**: Blok je kritický pokud do něj hashovací funkce pošle více než $\frac{2}{3} \cdot 2^t$ prvků (více než 10)

3. **Chernoffova meze**
Teď musíme spočítat jaká je pravděpodobnost, že se objeví kritický blok (budeme mít smůlu). Tedy, do bloku $K$ spadne $> \frac{2}{3}K$ prvků, když průměr je jen $\frac{1}{3}K$

K tomu slouží **Chernoffova mez**. Je to pravděpodobnostní věta, která říká:
> Když sčítáš nezávislé náhodné jevy (hodíme $n$-krát kostkou), tak pravděpodobnost, že se výsledek extrémně odchýlí od průměru, klesá exponenciálně rychle

4. **Aplikace Chernoffovy meze**
	1. Střední hodnota ($\mu$)
		- Očekávaný počet prvků v bloku je $\mu = \frac{1}{3} \cdot 2^t$
	2. Odchylka
		- My se ptáme na situaci, kdy počet prvků v bloku bude $\leq \frac{2}{3} \cdot 2^t$. To je přesně $2\mu$ (dvojnásobek průměru - $c=2$)
	3. Vzorec
		Chernoffova mez říká, že pro ochylku $c=2$:
		$$P[X\geq 2\mu] \leq (\frac{e^{2-1}}{2^2})^\mu=(\frac{e}{4})^\mu $$
	4. Výsledek
	$$ P[\text{Blok je kritický}] \leq (\frac{e}{4})^{2^t/3} \approx 0.879^{2^t} $$
> [!note] **Co nám to říká (To nejdůležitější):** 
> Pravděpodobnost, že vznikne kritický blok, klesá **exponenciálně** s jeho velikostí.
>
> - Malý blok se "přeplní" celkem snadno.
>- Obrovský blok se "přeplní" s pravděpodobností skoro nula.

> [!important] Význam kritického bloku
>Aby mohl existovat shluk, musí být někde zdroj, který dodává výrazně víc prvků než průměr

4. **Průměrná délka shluku**
- Pokud mám shluk délky $L$, musel ho způsobit nějaký kritický blok o velikosti cca $L/4$ 
> kdybychom hledali kritický blok o velikosti $L$ (stejně velký jako shluk), mohlo by se stát, že shluk leží "přes hranu" dvou velkých bloků (půlka v jednom, půlka ve druhém). Ani jeden z nich by pak nemusel být kritický, a přesto by dohromady vytvořily shluk.), proto $L/4$

Pak můžeme usoudit, že:
$$ P[\text{existuje shluk délky L}] \leq P[\text{blok L/4 je kritický}]$$

- Střední hodnota délka shluku je součet pravděpodobností všech délek
$$ \mathbb{E}[\text{Délka shluku}] \approx \sum_L L \cdot P[\text{existuje shluk délky L}] \leq \sum_L L \cdot P[\text{blok L/4 je kritický}]$$
> - $L$ může nabývat všech možných hodnot - shluk může mít délky $1,2,3,\dots,\infty$
> - Dává to smysl. $\mathbb{E}$ je teoretická hodnota, která se nedá spočítat v konečně krocích

- Díky Chernoffově mezi víme, $P[\text{shluk délky L/4}]$ klesá jako $0.879^{L/4}$

- Součet řady $\sum L \cdot 0.879^{L/4}$ konverguje ke konstantě

6. **Výsledek**
Očekávaný počet pokusů je $O(1)$



