---
tags:
  - distributed_system
language: czech
---
Lamportův algoritmus je permission-based [synchronizační algoritmus](/notes/koordinace-a-synchronizace-v-distribuovanem-systemu/) pro [distribuované vzájemné vyloučení](/notes/vzajemne-vylouceni-v-distribuovanych-systemech/), který využívá [logické hodiny](/notes/logicky-cas/) k vytvoření totálního uspořádání žádostí. Vedlejší efekt totálního uspořádání je totiž vzájemné vyloučení.

---
Je to předchůdce Ricart-Agrawaly. Je to **první algoritmus**, který ukázal, jak využít [logické hodiny](/notes/logicky-cas/) pro úplnou synchronizaci.
> [!note]
> Lamportův algoritmus se dnes nepoužívá kvůli velkému počtu zpráv, ale je to **perfektní edukativní příklad**, jak fungují logické hodiny v praxi. Ukazuje, že pokud máme Totální uspořádání zpráv, máme i triviální vzájemné vyloučení.

---
## Princip
Lamportův algoritmus garantuje vstup do kritické sekce (CS) přesně v tom pořadí, v jakém vznikly požadavky (podle logického času). Je tedy **spravedlivý (FIFO)**.

### Předpoklady
- Komunikace je spolehlivá a FIFO (zprávy mezi dvěma procesy se nepředbíhají).
- Každý proces má frontu požadavků.

### Algoritmus
1. **Žádost (request):**
    - Proces Pi​ chce do CS.
    - Zvýší své hodiny, vytvoří zprávu `REQUEST(Time, ID)` a pošle ji **všem** (i sobě).
    - Každý příjemce (včetně odesílatele) vloží tuto žádost do své lokální fronty seřazené podle času.
    - Každý příjemce pošle zpět `REPLY` (tím potvrdí: "Vím o tobě").

2. **Rozhodnutí (decision):** Proces $P_i$​ vstoupí do CS, pokud platí **obě** podmínky:    
    - **A)** Jeho vlastní žádost je na **vrcholu** jeho lokální fronty (je nejstarší).
    - **B)** Od **všech** ostatních procesů obdržel zprávu (jakoukoliv - REPLY, REQUEST nebo RELEASE) s časovým razítkem **vyšším**, než je čas jeho žádosti.
        
    - _(Proč B? Protože díky FIFO kanálům to znamená, že nikdo už nemůže poslat starší žádost, která by ho předběhla)._
        
3. **Uvolnění (Release):**
    - Proces opustí CS.
    - Odstraní svou žádost z fronty.
    - Pošle zprávu `RELEASE` všem.
    - Příjemci po přijetí `RELEASE` odstraní žádost ze svých front (čímž se na vrchol dostane další čekající).

