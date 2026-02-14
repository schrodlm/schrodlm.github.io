---
tags:
  - distributed_system
language: czech
title: "idempotence v RPC"
---
Pro RPC je velmi důležité, aby operace byly [idempotentní](/notes/idempotence/).

V lokálním programování (na jednom PC) víš, jestli funkce proběhla, nebo program spadl. V distribuovaném systému (nativním prostředí pro RPC) existuje stav neurčitosti kvůli chybě sítě.

**Příklad (lost acknowledgment problem):**
1. Klient odešle požadavek `deduct($100)`.
2. Server požadavek přijme a strhne peníze.
3. Server odešle potvrzení (ACK).
4. **Potvrzení se ztratí v síti.**
5. Klientovi vyprší časovač (timeout), protože nedostal odpověď.
6. Klient se domnívá, že server nefunguje, a odešle požadavek znovu.

- Pokud operace **není idempotentní** (např. "strhni 100"), server ji provede podruhé. Uživatel přišel o $200.