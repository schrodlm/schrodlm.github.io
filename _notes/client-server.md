---
tags:
  - distributed_system
language: czech
title: "client-server"
---
Nejběžnější model.
- **Role:**
    - **Server:** Pasivní, čeká na požadavky, spravuje zdroje (data), poskytuje službu.
    - **Client:** Aktivní, iniciuje komunikaci, žádá o službu.

- **Charakteristika:** Centralizovaná správa dat, snazší zabezpečení, ale server je single point of failure a bottleneck výkonu.
    
- **varianta multi-tier :** Typicky 3-tier (Prezentační vrstva (client) ↔ Aplikační logika (Server) ↔ Data (databáze)). To umožňuje lepší škálování jednotlivých vrstev.

## [Stavovost](/notes/stavovost-distribuovaneho-systemu/)
- **Stateful přístup (Sessions):**
    - Když se přihlásíš, server si do RAM uloží "Session ID 123 = Uživatel Jan".
    - Klient posílá jen ID 123.
    - **Problém pro architekturu:** Pokud máš 10 serverů a [load balancer](/notes/load-balancer/).
    - **Sticky Sessions (Session Affinity)**. [load balancer](/notes/load-balancer/) musí pamatovat, že "Jana" musí posílat vždy na "Server 1", protože "Server 2" jeho session v paměti nemá. To komplikuje škálování.
- **Stateless přístup (REST API / Tokeny):**
- Server neukládá nic.
- Klient pošle s každým požadavkem **Token** (např. JWT), ve kterém je zašifrováno "Jsem Jan, mám práva admina".
- **Výhoda:** Požadavek může vyřídit _jakýkoliv_ server. Když jeden spadne, nic se nestane.