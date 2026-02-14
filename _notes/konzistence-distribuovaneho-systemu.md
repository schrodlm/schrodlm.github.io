---
tags:
  - distributed_system
language: czech
---
Konzistence popisuje jak moc mají různé uzly stejný (nebo kompatibilní) pohled na data a stav systému.

Problém zajištění **konzistence** vzniká jako přímý a nevyhnutelný důsledek [replikace](/notes/replikace/).

---
Konzistence není binární (ano/ne), ale je to **spektrum**. Můžeme mít stav, který je:

1. **Silně konzistentní:** Všechny uzly vidí přesně totéž ve stejný okamžik (chová se to jako jeden počítač).
2. **Slabě konzistentní:** Uzly se mohou dočasně lišit, ale nakonec se shodnou.

Výběr toho, "jak moc" konzistentní stav potřebujeme, definují **[modely konzistence distribuovaného systému](/notes/modely-konzistence-distribuovaneho-systemu/)**.

---
## Silná konzistence (strong consistency)
Model, který se snaží nekonzistenci zcela eliminovat (nebo ji skrýt před uživatelem). Systém garantuje, že **všechny** uzly vidí ve stejný okamžik **stejná data**.

- **Princip:** Chová se to jako **jeden jediný počítač**. Jakmile je operace zápisu potvrzena klientovi, _kdokoliv_ a _kdekoliv_, kdo si data přečte, musí vidět tuto novou hodnotu.
    
- **Cena přístupu:**
    - **Vysoká latence:** Zápis trvá dlouho, protože musíme čekat, až se data propíší na ostatní uzly (nebo alespoň do kvóra).
    - **Nízká dostupnost ([CAP theorem](/notes/cap-theorem/)):** Pokud se přeruší spojení mezi uzly, systém se musí **zastavit** (přestat přijímat zápisy), aby nevznikla chyba. Nemůže riskovat rozdílná data.
- **Typické modely:**
    - **Linearizovatelnost (linearizability):** Absolutní shoda s reálným časem (nejpřísnější model).
    - **Sekvenční konzistence (sequential consistency):** Shoda s logickým pořadím operací.
## Slabá konzistence (weak consistency)
Model, který **akceptuje nekonzistenci** výměnou za rychlost a dostupnost. Systém negarantuje, že čtení vrátí nejnovější hodnotu. Může vrátit starou (stale) hodnotu.

- **Princip:** "Dám ti data hned, jak je mám u sebe. Možná nejsou nejnovější, ale jsou dostupná ihned."
- **Záruka:** Systém většinou garantuje pouze to, že se data **nakonec** sjednotí (pokud přestanou chodit nové zápisy).
    
- **Výhoda:**
    - **Extrémní výkon:** Zápis i čtení jsou lokální operace, na nikoho se nečeká.
    - **Vysoká dostupnost:** I když spadne půlka sítě, můžu stále číst i zapisovat (i když to může vést ke konfliktům).
        
- **Typické modely:**
    - **Eventual consistency** "Když se přestane zapisovat, všechny repliky se nakonec shodnou." (Používá DNS, sociální sítě).
    - **Kauzální konzistence:** Garantuje pořadí jen u souvisejících operací (odpověď vidím až po otázce), zbytek může být "rozházený".

## Nekonzistence
Nekonzistence je **stav**, kdy se data v různých replikách téhož systému liší. Není to nutně chyba, ale přirozená vlastnost distribuovaného systému v čase mezi zápisem a synchronizací.

- **Definice:** Systém je nekonzistentní, pokud čtení stejné datové položky (x) na různých uzlech (N1​,N2​) vrátí ve stejný okamžik **různé hodnoty**.
    
- **Příčina:** Zpoždění sítě (latency). Informace o změně ("Zapsal jsem 5") cestuje k ostatním uzlům rychlostí sítě, ne okamžitě.
    
- **Příklad:**
    - Uživatel A změní na serveru v Praze heslo.
    - Uživatel B (admin) se o milisekundu později podívá na server v New Yorku a vidí stále staré heslo.
    - _Stav:_ Systém je dočasně nekonzistentní.

> [!warning] Riziko 
> Pokud nekonzistence trvá příliš dlouho nebo není řízena, může vést k **logickým chybám** (např. výběr peněz z účtu, kde už nejsou, protože bankomat A nevěděl o výběru z bankomatu B).

### Příčiny nekonzistence stavu
#### 1. Neexistuje globální stav
- Nejde přesně říct, „v jakém stavu je systém teď“
- Každý uzel má **svůj lokální pohled**
- Přestože v distribuovaném systému neexistuje jediný okamžitý globální stav , je možné jej určitým způsobem **odhadnout nebo rekonstruovat**. Viz: [detekce globálního stavu](/notes/detekce-globalniho-stavu/)

> [!note] Důsledek
> - nelze spolehlivě provádět okamžité globální kontroly („všichni hotovo?“)

**Stav distribuovaného systému**
- souhrn stavů všech uzlů + stav komunikace mezi nimi (zprávy „na cestě“).
#### 2. Asynchronní komunikace
- Zprávy se:
    - zpožďují
    - mohou dorazit v jiném pořadí
    - mohou se ztratit nebo zdvojit
- Stav uzlu se mění **nezávisle** na ostatních

> [! note] Důsledek
> - stav se mezi uzly **rozchází** (inconsistent state)
#### 3. Replikovaný stav
Aby byl distribuovaný systém spolehlivý (když jeden uzel shoří, data nezmizí) a rychlý (data jsou blízko uživatele), musíme data **replikovat** (kopírovat na více uzlů). Tím implicitně vzniká nekonzistence.

### Závěr
V distribuovaných systémech se tedy nevyhneme s nekonzistencí stavu systému. Perfektní konzistence je nemožná nebo extrémně drahá. Řešením jsou #Modely konzistence.