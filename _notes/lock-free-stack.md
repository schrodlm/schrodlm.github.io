---
layout: note
title: "Lock Free Stack"
---


## Návrh

Zásobník je reprezentován jako linked list

- **PUSH (Vložení):**    
    1. Vytvoř nový uzel $n$.
    2. Přečti aktuální vrchol `h = stack.head`.
    3. Nastav `n.next = h`.
    4. Proveď `CAS(stack.head, h, n)`.
        - Pokud uspěje (hlava je stále `h`), konec.
        - Pokud neuspěje (hlava se změnila), opakuj od kroku 2

**POP (Odebrání):**
1. Přečti aktuální vrchol `h = stack.head`.
2. Přečti následníka `s = h.next`.
3. Proveď `CAS(stack.head, h, s)`.
    - Pokud uspěje, vrať `h`.
    - Pokud neuspěje, opakuj od kroku 1 .

#### Analýza

- **Korektnost:** [CAS](/notes/cas/) zaručuje, že pokud jiný proces modifikuje hlavu zásobníku mezi naším čtením a zápisem, operace se restartuje.
- **Vlastnost Lock-free:** Systém jako celek postupuje. Pokud CAS selže, znamená to, že jiný proces uspěl. Nemůže nastat deadlock (uvíznutí).
- **Livelock:** Teoreticky se může stát, že jeden proces neustále selhává, protože ho ostatní předbíhají. V praxi je to nepravděpodobné .