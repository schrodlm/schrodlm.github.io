---
tags:
  - distributed_system
language: czech
title: "RPC"
---
RPC je [komunikační model](/notes/komunikacni-model.html) a poskytuje koncept volání distribuovaných metod, který je možný využít v jakékoliv DS architektuře. 

Je klíčovou abstrakcí, která se snaží, aby volání funkce na vzdáleném stroji vypadalo syntakticky stejně jako volání lokální funkce. Zásadní rozdíl je však v sémantice selhání. Zatímco lokální volání buď proběhne, nebo celá aplikace spadne, RPC může selhat částečně – zpráva se ztratí, server spadne po vykonání instrukce, nebo se ztratí odpověď.

- **Princip:** Klient zavolá funkci `add(a, b)`. O zbytek se postará middleware. Programátor neřeší sockety.
> [!note] Problém
> RPC je typicky **synchronní** (blokující). Klient čeká, dokud server neodpoví. Pokud server spadne, klient zamrzne.

Důležité je také mít na pamětí důležitost [idempotence v RPC](/notes/idempotence-v-rpc.html)

## Mechanismus
### Odeslání požadavku (request)
1. **Client Call:** Klientská aplikace zavolá lokální funkci `add(5, 10)`.
2. **Client Stub:**
    - Převezme volání.
    - Provede [marshalling](/notes/marshalling.html): Vezme parametry (čísla 5 a 10) a zabalí je do standardizovaného formátu zprávy (např. JSON)    
    - _Důležité:_ Zde se řeší rozdíly v reprezentaci dat 
3. **Send:** Client Stub předá zabalenou zprávu operačnímu systému (RPC Runtime).
4. **Transport:** OS pošle zprávu po síti (TCP/UDP) na server.
### Zpracování na serveru
5. **Receive:** Operační systém serveru přijme zprávu a předá ji Server Stubu.
6. **Server Stub (Skeleton):**
    - Provede [Unmarshalling](/notes/marshalling.html): Rozbalí zprávu a vytáhne z ní parametry (5, 10).
    - Identifikuje, která procedura se má volat (podle ID ve zprávě).
7. **Server Call:** Server Stub zavolá skutečnou funkci `add(5, 10)` v implementaci serveru.    
8. **Execution:** Server provede výpočet (5+10=15).

### Návrat výsledku (response)
9. **Return:** Server vrátí výsledek (15) Server Stubu.
10. **Server Stub:** Provede [marshalling](/notes/marshalling.html) výsledku (zabalí číslo 15 do zprávy).
11. **Transport:** Zpráva putuje po síti zpět ke klientovi.
12. **Client Stub:**
    - Přijme zprávu.
    - Provede **[unmarshalling](/notes/marshalling.html)** (vytáhne číslo 15).
13. **Return to App:** Client Stub vrátí hodnotu 15 klientské aplikaci.

**Výsledek:** Klient má v proměnné `result` číslo 15 a nemá tušení, že to proběhlo na jiném kontinentu.
![Image](/assets/img/Pasted image 20260116132458.png)

>[!note] Architektura
>Zajímavé je, že z mechanismu volání samotný princip RPC **vždy vytváří dočasný vztah klient-server** pro dané konkrétní volání, bez ohledu na celkovou architekturu systému.


### IDL (interface definition language)
- Jak Client Stub ví, jak funkci zabalit, a Server Stub, jak ji rozbalit? Musí se shodnout na "smlouvě".
- Píše se v neutrálním jazyce (např. `.proto` soubory u gRPC).
- **Kompilátor IDL** pak vygeneruje kód Stubu (pro klienta) a Skeletonu (pro server) automaticky.
---
## Garance
### [Spolehlivost (delivery semantics)](/notes/spolehlivost-delivery-semantics.html)
Různé implementace RPC můžou garantovat různé typy delivery semantics

### Uspořádání
I když je RPC 1:1 komunikace (unicast), má uspořádání. Většinou se bavíme o totální uspořádání (per connection)

---

