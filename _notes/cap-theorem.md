---
tags:
  - distributed_system
language: czech
---
V distribuovaném systému, který ukládá data, je **nemožné** dosáhnout současně všech tří následujících vlastností:

1. **C - Consistency (konzistence):**
    - Každé čtení vrátí nejnovější zapsanou hodnotu (nebo chybu).
    - Odpovídá **silné konzistenci**. Všechny uzly vidí to samé.

2. **A - Availability (dostupnost):**
    - Každý požadavek na neselhávající uzel obdrží odpověď (bez chyby), ale bez záruky, že obsahuje nejnovější data.
    - Systém "nikdy nespí", i když možná lže (vrací stará data).
3. **P - Partition tolerance (odolnost vůči rozdělení):**
    - Systém funguje dál, i když se síť přeruší a uzly spolu nemohou komunikovat (ztráta zpráv, rozpad na ostrovy).

> [!important] Pravidlo "Vyber si dvě" 
> Teoreticky si můžeš vybrat libovolné dvě vlastnosti. V **reálných distribuovaných systémech** je ale volba složitější, protože **P (Partition Tolerance) je nutnost**.

---
### Realita: P je nevyhnutelné
Protože sítě nejsou spolehlivé (kabely se trhají, routery padají), **Partition Tolerance (P) musí být vždy zapnutá**. Nemůžeme si dovolit, aby pád sítě shodil celý systém.

Reálná volba se tedy zužuje na rozhodování: **Co se stane, když se síť rozpadne?**

Máme jen dvě možnosti: **CP** nebo **AP**.
#### 1. CP Systémy (consistency + partition tolerance)

**Priorita:** Bezpečnost dat.
- **Scénář:** Síť se rozpadne. Uzel A nemůže mluvit s uzlem B.
- **Reakce:** Abychom zabránili nekonzistenci (aby si A a B nemysleli různé věci), systém **odmítne odpovídat** na jedné (nebo obou) stranách rozpadu. Vrací chybu nebo timeout.

- **Oběť:** Obětujeme Dostupnost (A).
- **Příklad:** Bankovní systémy, Distribuované databáze s transakcemi (HBase, MongoDB se zapnutým `readConcern: majority`, Redis v určité konfg.).
    - _Nemůžu vybrat peníze z bankomatu, pokud bankomat neví, jestli jsem je už nevybral jinde._
#### 2. AP Systémy (Availability + Partition Tolerance)
**Priorita:** Dostupnost služby.
- **Scénář:** Síť se rozpadne.
- **Reakce:** Oba uzly (A i B) přijímají zápisy a čtení, i když spolu nemluví. Data se rozcházejí. Až se síť spojí, vzniklý "bordel" (konflikty) se nějak vyřeší (merge).
- **Oběť:** Obětujeme Konzistenci (C). Máme jen modely konzistence distribuovaného systému#Eventual Consistency (Případná).
    
- **Příklad:** Sociální sítě (lajky), DNS, Cassandra, Amazon Dynamo (nákupní košík).
    
    - _Raději ti dovolím vložit zboží do košíku (abych vydělal), i když to zboží možná už není na skladě._
        

#### 3. CA Systémy (Consistency + Availability)

**Teoretická kategorie.**

- Znamená to systém, který je konzistentní a dostupný, ale **nesmí se rozpadnout síť**.
    
- V distribuovaném systému to prakticky neexistuje. Jakmile se síť rozpadne, systém přestane být C nebo A.
    
- _Příklad:_ Relační databáze (SQL) běžící na **jednom stroji**.