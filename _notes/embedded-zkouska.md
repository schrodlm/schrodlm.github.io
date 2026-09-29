---
layout: note
title: "EMBEDDED ZKOUŠKA"
---

## Přednáška 1 - Introduction

**real-time systém**
systém reagující na vnější změny, podle kterých vykonává funkcí a výsledek doručuje v nějakém čase
![Image](/assets/img/Pasted image 20260616171401.png)
**korektnost real-time systému**
system, jehož korektnost zavisí jak na správném výsledku tak i na správném načasování *např. airbag*

Důraz na to, že oproti non-real-time systémům je zde extrémně důležitý čas 
- výsledek musí být dodán ve správném čase, jinak je k ničemu (propásl svoje využití)

**kritičnost z pohledu bezpečnosti**
RT systému můžou, ale nemusí být safety-critical
*např. brzdový systém u vozidla vs. promítání videa*

**dvě osy real-time systémů**
1. **Rychlost**
	- jak rychle je zpracuje vstup a odpoví se na něj (delay)
2. **Jak často**
	- jak často je potřeba dostávat vstup z okolího světa, abychom o něm měli dostatečný přehled (perioda)
![Image](/assets/img/Pasted image 20260616171636.png)

**real-time != rychlost**
real-time nemusí být nutně rychlý systém, nejdůležitější je, že je předvidatelný/deterministický 
> “A man drowned in a river with an average depth of 20 centimeters”

**Komunikace s prostředím**
komunikace s vnějším prostředím je zprostředkována pomocí:
- **senzorů** - dodávají informace o vnějším světě
- **aktuátorů** - vykonávají akce ve vnějším světě

---

## Přednáška 2 - Scheduling

**RT scheduling**
RT systém je často zodpovědný za několik úkolů naráz -> každý z těchto úkolů má svoji prioritu a deadline
Scheduling je pokus o rozdělení úkolů tak, aby plnili svoji deadline

**Schedulable systém**
Systém je schedulable, pokud existuje rozdělení úkolů takové, že všechny úkoly dokončí v požadovaný čas

**Periodic task**
Aktivace tohoto tasku se děje v deterministický čas  s konstantní periodou

**Aperiodic task**
Aktivace tasku není deterministická, může se chtít provést v libovolný čas

**Zdroj**
Softwarová struktura, sloužící v obsloužení task

**Sdílený sdroj**
Softwarová struktura, sdílená mezi více tasky sloužící těchto tasků

**General scheduling problem (NP-complete)**
Mějme:
1. množinu tasků $J = \{J_1, J_2, \dots, J_n\}$
2. množinu procesorů $P = \{P_1,P_2, \dots, P_m\}$
3. množinu zdrojů $R = \{R_1, R_2, \dots, R_r\}$
Přirazení procesorů $P$ a zdrojů z $R$ k taskům z J tak, aby se všechny tasky splnili v rámci daných omezení

**Rozdělení scheduling algoritmů**
1. **Preemptive** - běžící task může být kdykoliv přerušen
2. **Dynamic** - běžící task musí být dokončen před začátkem jiné práce

3. **Static** - scheduling se rozhoduje na základě daných a neměnných parametrů
4. **Dynamic** - parametry schedulingu se můžou v runtime měnit

5. **Offline** - scheduling je daný před samotným rozběhnutím a nemění se
6. **Online** - scheduling se rozhoduje na dalším tasku až při runtime

**Graham theorem**
> „U optimálního rozvrhu úloh může paradoxně přidání procesorů, zkrácení času tasků nebo uvolnění jejich návazností celkovou dobu výpočtu prodloužit.“

