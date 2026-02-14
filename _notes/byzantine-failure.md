---
layout: note
title: "Byzantine Failure"
---

**Byzantine failure** je selhání, při kterém se proces může chovat **zcela libovolně**, bez dodržení specifikace systému.

To zahrnuje:
- posílání **nesprávných** zpráv
- posílání **různých** zpráv různým procesům
- **lhaní** o svém stavu
- **koluzi** s jinými chybnými procesy
- náhodné, chaotické nebo **zlovolné** chování
- chování, které se tváří korektně, ale **není**

## Řešení
Aby systém fungoval správně i při takovém selhání, musí náš distribuovaný systém mít vlastnost [BFT (byzantine fault tolerance)](/notes/bft-byzantine-fault-tolerance/)

## Vznik
Problém byl definován na těchto dvou příkladech

### Problém byzantských generálů
Řeší situaci, kdy kanál je spolehlivý, ale uzly mohou být zrádné (posílají konfliktní informace, lžou).
- Pravidlo: Aby systém toleroval $f$ zrádných uzlů, musí mít celkem $N \ge 3f + 1$ uzlů.
    
- Vysvětlení ($N=3$, $f=1$): Generál (velitel) pošle "Útok". Zrádný poručík řekne druhému poručíkovi: "Velitel řekl Ústup". Druhý poručík neví, kdo lže (velitel nebo kolega). Při 4 uzlech lze většinovým hlasováním lháře izolovat.
