---
tags:
  - distributed_system
language: czech
title: "komunikace v distribuovaných systémech"
---
Jak si uzly mezi sebou předávají data? Protože nemáme sdílenou paměť, je způsob, jakým si předáváme zprávy, důležitý pro korektní chování systému.

K implementaci komunikace v distribuovaném systému používáme abstrakce v podobě [komunikačních modelů](/notes/komunikacni-model.html).

---
Je důležité rozdělit systém ve kterém komunikace probíhá a náturu jakou v tomto systému má komunikace předpoklady. [modely časování (timing models)](/notes/modely-casovani-timing-models.html)

## Typy komunikací
Komunikace v distribuovaných systémech se dělí podle synchronnosti, vazby v čase, adresování, záruk doručení a pořadí – a každá volba přímo ovlivňuje konzistenci, stavovost a [spolehlivost distribuovaného systému](/notes/spolehlivost-distribuovaneho-systemu.html).

## Synchronizace (Časová vazba)
Tady se rozhodujeme, jak moc jsou odesílatel a příjemce svázáni v čase.

### Synchronní komunikace (blocking)
- **Jak to vypadá:** Odesílatel pošle zprávu a zastaví svou činnost, dokud nedostane odpověď nebo potvrzení.
- **Příklad:** [RPC](/notes/rpc.html), HTTP Request/Response.

- **Výhoda:** Snadno se programuje (vypadá to jako lokální kód). Okamžitě víš, jestli to prošlo.
- **Nevýhoda:** **Tight Coupling (Úzká vazba).** Pokud je server nebo síť pomalý, klient zamrzne. Celý systém se zpomalí na rychlost nejpomalejšího článku.

### Asynchronní komunikace (non-blocking)
- **Jak to vypadá:** Odesílatel pošle zprávu a okamžitě pokračuje v práci. Odpověď (pokud je třeba) zpracuje, až přijde (pomocí callbacku nebo přerušení).
- **Příklad:** message queues (RabbitMQ, Kafka), One-way RPC.

- **Výhoda:** **Loose Coupling (Volná vazba).** Odesílatel je nezávislý na rychlosti příjemce. Systém lépe škáluje.
- **Nevýhoda:** Mnohem složitější na programování (musíš řešit stavy, co když odpověď nepřijde nikdy, co když přijdou v jiném pořadí).

---
## Adresace (prostorová vazba)
Tady řešíme, komu to posíláme.
### Unicast (1:1)
- Klasika. Klient ↔ Server.
### Broadcast (1:N) – skupinová komunikace
[skupinová komunikace (broadcast)](/notes/skupinova-komunikace-broadcast.html)



