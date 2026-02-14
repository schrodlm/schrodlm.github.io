---
tags:
  - distributed_system
language: czech
title: "spolehlivost distribuovaného systému"
---
**Spolehlivost distribuovaného systému** popisuje, nakolik lze systému důvěřovat, že bude dlouhodobě poskytovat správnou službu navzdory chybám, poruchám a nepředvídatelným podmínkám prostředí.

Je to zastřešující vlastnost, která není o jednom běhu systému, ale o jeho chování **v čase**.

>[!note] Jak získat spolehlivost
> Protože komponenty selhávají, spolehlivost získáme jen tím, že máme všeho víc. (redundance)

Typy redundance:
1. **Informační redundance:** Přidáme bity navíc pro opravu chyb (ECC paměť, checksumy v paketech).
2. **Časová redundance:** Když se akce nepovede, zkusíme to znovu (retry logic v [RPC](/notes/rpc.html)).
3. **Fyzická redundance ([replikace](/notes/replikace.html)):** Místo jednoho serveru máme tři.
### [vztah spolehlivosti a stavu distribuovaného systému](/notes/vztah-spolehlivosti-a-stavu-distribuovaneho-systemu.html)

---
## Vlastnosti co chceme

1. **Availability (Dostupnost):**
- Pravděpodobnost, že systém poskytuje službu v daném okamžiku.
- _Metrika:_ Uptime.
- _Řeší:_ replikace, failover, quorum-based algoritmy, slabší modely konzistence.

2. **Reliability (Spolehlivost v užším smyslu):**
    - Schopnost běžet nepřetržitě bez selhání po určitou dobu.    
	- _Metrika:_ MTBF.
	- _Řeší:_ architektura systému, redundance, recovery mechanizmy.

3. **Safety (Bezpečnost provozu):**
    - Když už systém selže, nesmí způsobit katastrofu (např. jaderná elektrárna, ovládání brzd).
	- _Řeší:_ synchronizační algoritmy, konsenzus, safety properties.

4. **Integrity (Integrita):**
    - Systém nesmí data náhodně měnit nebo poškodit.
	    _Řeší:_ konzistence, atomické operace, transakce.