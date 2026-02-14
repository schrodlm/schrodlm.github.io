---
layout: note
title: "mutex"
---

mutex je základní synchronizační primitivum, které zajišťuje, že v daný moment pracuje s datovou strukturou pouze jeden proces.

- **Stavy:** Zamčeno / Odemčeno.
- **Operace:**
    - `LOCK`: Pokud je odemčeno, zamkni. Pokud je zamčeno, čekaj, dokud se neodemkne .
    - `UNLOCK`: Pokud je zamčeno, odemkni.
**Použití:** Operace nad strukturou se obalí do páru LOCK/UNLOCK, což zajistí atomicitu z pohledu pozorovatele .