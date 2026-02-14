---
tags:
  - distributed_system
language: czech
title: "modely konzistence distribuovaného systému"
---
Modely konzistence jsou **formální dohody (smlouvy)** o tom, **jaká nekonzistence je povolená a jak se smí projevit**.

Neříká _jak_ to systém dělá, ale _co_ musí být pravda.

Bez modelu konzistence **nelze říct, zda je pozorované chování správné nebo chybné**.

---
## Princip
Definuje **smlouvu (kontrakt)** mezi distribuovaným datovým úložištěm (DS) a klientem.

- Určuje pravidla, jak a kdy se změny provedené jedním procesem zviditelní ostatním.
- **Hlavní trade-off:** Čím silnější konzistence (data jsou více „jako na jednom PC“), tím horší výkon a dostupnost ([CAP theorem](/notes/cap-theorem.html)).
>[!note] Klient
> Klient je v distribuovaném systému **role procesu**, který aktivně iniciuje komunikaci zasláním požadavku (Request) za účelem využití služby. Tento proces běží na uzlu, který se v tu chvíli označuje jako klientský uzel.

---
## [Vztah mezi komunikačními modely a konzistencí v distribuovaných systémech](/notes/vztah-mezi-komunikacnimi-modely-a-konzistenci-v-distribuovanych-systemech.html)
Model konzistence je **cílový stav**, komunikační model je **prostředek**, jak ho dosáhnout. Fyzikální vlastnosti komunikace limitují maximální dosažitelnou konzistenci.

---
## Dělení modelů (Data-centric)
Modely seřazené od **nejsilnějších** (nejdražších) po **nejslabší** (nejrychlejší).

### Silné modely (Strong consistency)
Snaží se simulovat chování jednoho počítače. Vyžadují synchronizaci (blokování).
#### Strict Consistency (striktní)
- _Definice:_ Jakýkoliv zápis je **okamžitě** viditelný všem.
- _Realita:_ **Nemožné** v distribuovaném systému (rychlost světla). Slouží jen jako teoretický ideál.       
#### Linearizability (Linearizovatelnost / Atomická):
- _Definice:_ Operace vypadají, že proběhly **instantně** v nějakém bodě mezi voláním a návratem. Musí respektovat **reálný čas**.
- _Laicky:_ Když mi server A potvrdí zápis v 12:00:01, tak server B v 12:00:02 už **musí** vrátit novou hodnotu.
- _Použití:_ Bankovní systémy, zámky, semafory.

#### Sequential Consistency (Sekvenční)
- _Definice:_ Výsledek je stejný, jako by se operace všech procesů provedly v nějakém **sekvenčním pořadí**, které respektuje pořadí instrukcí v jednotlivých programech. Neřeší reálný čas.
- _Laicky:_ Je jedno, jestli se zápis projeví za sekundu nebo za minutu, ale **všichni musí vidět změny ve stejném pořadí**.
- _Použití:_ Databázové repliky.

> [!NOTE] Rozdíl Linearizability vs. Sequential
> **Linearizability** řeší reálný čas (když já zavolám mobilem, ty to hned slyšíš). **Sequential** řeší jen shodu (je jedno, že zpráva přišla pozdě, hlavně že jsme ji všichni přečetli jako druhou v pořadí).

---
### Slabé modely (weak consistency)

Obětují konzistenci pro rychlost a dostupnost ([CAP theorem](/notes/cap-theorem.html)). 
#### Causal Consistency (Kauzální)
- _Definice:_ Zápisy, které jsou **[kauzálně závislé](/notes/kauzalni-zavislost.html)** (příčina → následek), musí být všemi viděny ve stejném pořadí. Nezávislé (konkurentní) zápisy mohou být viděny různě.
- _Implementace:_ logický čas#Vektorové hodiny (vector clocks).
- _Příklad:_ Chat (Odpověď se nesmí zobrazit před Otázkou).
#### FIFO (PRAM) Consistency
- _Definice:_ Vidím zápisy od jednoho procesu ve správném pořadí. Zápisy od různých procesů se mohou míchat.
#### Eventual Consistency (Případná)
- _Definice:_ Pokud ustanou zápisy, **časem** (eventually) se všechny repliky shodnou. Mezitím mohou vracet stará data.
- _Použití:_ DNS, Web caching, Amazon Dynamo, Facebook feed.
- _Výhoda:_ Extrémně levné a dostupné (funguje i při výpadku sítě).
> [!note] Využití
> standard pro moderní webové aplikace kvůli **[CAP teorému](/notes/cap-theorem.html)**.

---
## Klientské záruky (Client-Centric Consistency)
Někdy server nedokáže garantovat globální konzistenci, ale může dát záruku **konkrétnímu klientovi** (Session guarantees). _Hodí se pro mobilní uživatele, kteří se přepojují mezi replikami._
- **Monotonic Reads:** Pokud jsem něco přečetl, už nikdy neuvidím starší verzi (nevracím se v čase).
- **Read-Your-Writes:** Vždy vidím data, která jsem sám zapsal (i když ostatní je ještě nevidí).
- **Writes-Follow-Reads:** Pokud čtu data X a pak zapíšu Y, tak Y je kauzálně po X.