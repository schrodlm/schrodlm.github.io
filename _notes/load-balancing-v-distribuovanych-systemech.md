---
layout: note
title: "load balancing v distribuovaných systémech"
---

Cílem je zajistit, aby žádný uzel nebyl přetížen, zatímco jiný zahálí. Tím přímo naplňujeme motivaci pro **scaling** a **výkon**.

### Cíle a prostředky

- **Krátkodobé úlohy:** Hlavním cílem je **minimalizace latence** (rychlá odezva pro klienta).
- **Dlouhodobé úlohy:** Cílem je **maximalizace celkového výkonu** systému (propustnost).
- **Správa:** Může být **centralizovaná/hierarchická** (typicky v clusterech) nebo **decentralizovaná/kooperativní** (P2P systémy).


>[!note] Souvislost s migrací
>**Statické vyvažování (Placement):** Rozhodnu se, kde proces poběží, **jen jednou** na samém začátku (při jeho spuštění). Pokud se uzel později přetíží, proces tam prostě „umře“ nebo bude pomalý.
>**Migrační vyvažování (Migratory Load Balancing):** Je mnohem pokročilejší. Systém sleduje zátěž v průběhu času a pokud se situace změní, procesy za běhu stěhuje. Vyžaduje [vzdálené spouštění procesů a migrace](/notes/vzdalene-spousteni-procesu-a-migrace/).

---
## Strategie vyvažování (zejména pro clustery)
Tyto algoritmy určují, kam poslat nový požadavek:

**Round Robin:** Úlohy se přidělují uzlům cyklicky jeden po druhém; vhodné pro homogenní systémy (stejné PC) a podobně náročné úlohy.

**Weighted Round Robin:** Uzly mají váhy podle své výkonnosti (silnější server dostane víc práce).

**Least Connections:** Úloha jde na uzel, který má aktuálně nejméně otevřených spojení/úloh.

**Dynamic Round Robin:** Průběžně se měří aktuální výkonnost uzlů a podle klouzavého průměru se upravuje příděl práce.

---
## Kooperativní a pokročilé algoritmy
V systémech, kde uzly spolupracují na výpočtech, se používají složitější schémata:

### Up-down algoritmus
Centrální koordinátor udržuje tabulku **"trestných bodů"** pro každý uzel.

- Pokud uzel využívá cizí procesory, body mu přibývají. Pokud má neuspokojené požadavky, body ubývají.
- Při uvolnění kapacity dostane přednost uzel s nejméně trestnými body (rovnoměrné sdílení).

### Vektorový algoritmus
- Každý uzel má vektor L s informacemi o zátěži v systému (své i cizí).
- Periodicky náhodně vybere jiný uzel a pošle mu polovinu svého vektoru.
- Tímto "drbem" ([gossip](/notes/epidemicke-protokoly/)_) se informace o volných kapacitách přirozeně a rychle šíří celým systémem.

---
### Iniciace vyvažování (Kdo začne?)
- **Sender-initiated:** Přetížený uzel aktivně hledá někoho, komu by práci předal.
- **Receiver-initiated:** Volný uzel se hlásí, že má hlad a chce práci.

---
## Shrnutí
| **Přístup**        | **Charakteristika**                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Centralizovaný** | Manažer zná zátěž všech (cca 1k–10k uzlů), velí a přiděluje.                              |
| **Lokální**        | Uzel zná jen svou zátěž; pokud překročí prahovou hodnotu, zkusí náhodně oslovit $n$ uzlů. |