---
layout: note
title: "zámky vs lock-free struktury"
---

> [!note] TL;DR
> - zámky jsou jednodušší a bezpečnější pro běžný kód, 
> - lock-free je náročnější, ale škáluje a neblokuje.

## Datové struktury se zámky (blocking)

- **Princip:** Používají [mutex](/notes/mutex.html) (často jemnozrnné - např. zámek pro každý uzel stromu nebo "sliding window" zámků).

### Problémy
- **deadlock**:Nekonečné čekání procesů na zámky držené navzájem.
- **priority inversion**: Proces s nízkou prioritou blokuje proces s vysokou prioritou.
- **starvation**: Proces se nemusí nikdy dostat na řadu.
- **no fault tolerance**: Pokud proces spadne, když drží zámek, zbytek systému navždy "zamrzne" .
- **composability**: Těžko se skládají atomické operace dohromady (např. přesun prvku mezi dvěma zamčenými strukturami může vést k deadlocku).

## Bezzámkové datové struktury ([lock-free struktura](/notes/lock-free-struktura.html))
**Princip:** Využívají [CAS](/notes/cas.html)/[LLSC](/notes/llsc.html). Zaručují, že alespoň jeden proces uspěje v konečném čase.

**Problémy:**
- **složitost:** Náročné na implementaci a dokazování korektnosti.
- **[ABA problém](/notes/aba-problem.html):** Nutno řešit verzováním nebo správou paměti.
- **Správa paměti:** Nelze jednoduše uvolnit paměť (`free`), protože ji může číst jiný proces. Nutno použít techniky jako _Hazard Pointers_ nebo _Reference Counting_ .
- **Livelock:** Procesy mohou neustále "bojovat" a restartovat se, i když systém jako celek postupuje.