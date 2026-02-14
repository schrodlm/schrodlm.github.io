---
tags:
  - distributed_system
language: czech
---
Velice důležité téma v [komunikaci v distribuovaných systémech](/notes/komunikace-v-distribuovanych-systemech/). Posíláš zprávu na jednu adresu skupiny a middleware se postará, aby ji dostali všichni _aktuální_ členové skupiny podle zvolených doručovacích garancí.

Zde narážíme [komunikační modely](/notes/komunikacni-model/), které skupinovou komunikaci navrhují. 
>[!note] 
>[skupinová komunikace (broadcast)](/notes/skupinova-komunikace-broadcast/) jako koncept negarantuje žádné uspořádání zpráv. Je garantována až samotným [komunikačním modelem](/notes/komunikacni-model/).

![Image](/assets/img/Pasted image 20260118192657.png)

---
## Typy skupin
### Podle přístupu (kdo může posílat zprávy?)

Toto je nejdůležitější dělení. Rozlišujeme skupiny **otevřené** a **uzavřené**.

#### Uzavřená skupina (closed group)
- **Pravidlo:** Zprávy mohou posílat **pouze členové skupiny**. Zvenčí do skupiny nikdo psát nemůže.
- **Použití:** Paralelní výpočty. (Máš 10 uzlů, které společně počítají počasí. Potřebují si vyměňovat mezivýsledky, ale nepotřebují vstupy od nikoho jiného).

#### Otevřená skupina (open group)
- **Pravidlo:** Zprávy může poslat **jakýkoliv proces v systému**, i když není členem skupiny.
- **Použití:** **Replikované servery.** Toto je kritické pro Client-Server architekturu. Klient (není členem) pošle požadavek "Get Data" na skupinu databázových serverů.