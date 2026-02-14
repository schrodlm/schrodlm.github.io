---
tags:
  - distributed_system
language: czech
---

> "Distribuovaný systém je soubor nezávislých počítačů (**uzlů**), které se uživatelům jeví jako jeden jediný systém."
> - Tanenbaum

## Princip
1. **Spolupráce:** Uzly samy o sobě úkol nezvládnou (nebo by to trvalo dlouho). Musí si práci rozdělit.

2. **[Middleware](/notes/middleware/):** Aby to fungovalo, existuje softwarová vrstva (nad operačním systémem, ale pod aplikací), která řeší, že data jsou jinde, pády uzlů a formátování zpráv. Bez middlewaru je to jen síť počítačů, ne distribuovaný systém.

3. **Message Passing:** Protože nemáme sdílenou paměť, veškerá synchronizace a výměna dat se děje posíláním jedniček a nul po drátě.

---
## Motivace
Proč implementovat distribuovaný systém.
1. **Scaling:**
    - Je levnější koupit 100 běžných serverů než 1 superpočítač (mainframe).
    - **Horizontální škálování:** Když systém nestíhá, prostě se přidá další levný počítač.

2. **Spolehlivost a dostupnost**
    - **single point of failure (SPOF):** Pokud máš jeden stroj a ten shoří, končíš (centralizovaný systém).
    - V distribuovaném systému, když jeden uzel vypadne, ostatní převezmou práci (při dobré implementaci). Systém běží dál.
3. **Výkon**
    - Paralelní zpracování. 10 procesorů spočítá úlohu rychleji než 1. (většinou)
		- samozřejmě musíme počítat s tím, že samotná mezikomunikace a její algoritmy je velký overhead
4. **Vlastní povaha problému:**
    - Někdy _musí_ být systém distribuovaný. Např. bankomaty jsou fyzicky na různých místech, ale musí komunikovat s centrálou. Nebo chatovací aplikace – uživatelé jsou po celém světě.

---
## Hlavní problémy
> _"Distribuovaný systém je takový systém, kde selhání počítače, o kterém jste ani nevěděli, že existuje, může způsobit nefunkčnost vašeho vlastního počítače."_
> - Leslie Lamport

- **Síť je nespolehlivá:** zprávy se mohou ztratit, zpozdit nebo přijít ve špatném pořadí.
- **Neexistují "globální hodiny":** Každý počítač má svůj čas. Je hrozně těžké říct, co se stalo dřív (událost A na serveru v Praze nebo událost B na serveru v New Yorku?). (více v Synchronizace a koordinace)
- **Bezpečnost:** Data létají po síti, je snazší je odposlouchávat.
- **Složitost softwaru:** Naprogramovat uzly tak, aby se to "jevily jako jeden systém", je složité.
- **Nekonzistentnost stavu**

>[!note] Chceme se obecně vyhnout centralizovaným věcem
>Tedy globálním hodinám, centralizovaným uzlům, myšlence že všechny uzly mají přístup ke všem informacím

> [!important] U návrhu distribuovaného systému by se mělo předejít předpokladům že:
> - Síť je spolehlivá,zabezpečená, homogenní, má nulovou latenci a neomezenou kapacitu
> - Topologie se nemění 
 > - Je jeden administrátor 

---
## Architektury
Zde definujeme logické uspořádání komponent a jejich role.
### [client-server](/notes/client-server/)
### [peer-to-peer (P2P)](/notes/peer-to-peer-p2p/)

---
## [Komunikace v distribuovaných systémech](/notes/komunikace-v-distribuovanych-systemech/)

---
## [Stavovost](/notes/stavovost-distribuovaneho-systemu/)
V **distribuovaných systémech** má stavovost zásadní význam, protože stav **není soustředěn na jednom místě**, ale je **rozprostřen mezi více uzly**, které spolu komunikují přes síť. To přináší nové problémy, které v lokálním systému vůbec neexistují.

---
## [Spolehlivost distribuovaného systému](/notes/spolehlivost-distribuovaneho-systemu/)
**Spolehlivost distribuovaného systému** popisuje, nakolik lze systému důvěřovat, že bude dlouhodobě poskytovat správnou službu navzdory chybám, poruchám a nepředvídatelným podmínkám prostředí.

---
## [Synchronizace a koordinace](/notes/koordinace-a-synchronizace-v-distribuovanem-systemu/)
V distribuovaných systémech chybí sdílená paměť a globální hodiny. To vede k nutnosti explicitní **koordinace** procesů. Řešíme dva hlavní okruhy problémů:

1. **Synchronizace času:** Jak sjednotit pohled na čas (fyzický nebo logický).  
2. **Koordinace akcí:** Jak zajistit, aby procesy spolupracovaly a nepřekážely si (vyloučení, volba leadera, konsenzus).

---
## [Distribuovaná sdílená paměť](/notes/distribuovana-sdilena-pamet/) (DSM)
**Distribuovaná sdílená paměť** je softwarová vrstva (middleware), která umožňuje procesům na různých uzlech přistupovat k datům tak, jako by byly v jedné společné RAM, přestože ve skutečnosti probíhá pod kapotou posílání zpráv (message passing).

---
## [správa prostředků a procesů v distribuovaném systému](/notes/sprava-prostredku-a-procesu-v-distribuovanem-systemu/)

Tato sekce řeší, jak efektivně využívat hardware (CPU, paměť) napříč celým systémem.

---
## [Masivně distribuované systémy](/notes/masivne-distribuovane-systemy/)
- Extrémní škálování

