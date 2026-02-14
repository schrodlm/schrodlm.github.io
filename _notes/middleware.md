---
tags:
  - distributed_system
language: czech
---
###  Transparentnost
DS dokáže skrýt před uživatelem složitost uvnitř. Tomu se říká _transparentnost_. Transparentnost poskytuje [middleware](/notes/middleware/).

Typy transparency:
- **Access transparency:** Nezáleží na tom, jestli přistupuji k datům z Windows nebo Linuxu, vypadá to stejně.
	- _Problém:_ Server je Linux (Little Endian), Klient je Java (Big Endian).
	- _Middleware řešení: **[marshalling](/notes/marshalling/)**, Middleware data automaticky převede do neutrálního formátu. Aplikace to nevidí.
- **Location transparency:** Nevím, kde fyzicky data leží (jestli na disku v PC nebo na serveru v Irsku), a je mi to jedno.
	- _Problém:_ Nevím IP adresu serveru, vím jen název služby.
	- _Middleware řešení:_ **discovery**, Middleware se podívá do tabulky, najde IP adresu a pošle to tam. Aplikace volá jen jméno.
- **Replication transparency:** Nevím, jestli existuje jedna kopie souboru nebo deset.
- **Failure transparency:** Když něco spadne, systém to skryje a já (uživatel) nic nepoznám (možná to jen trvá o sekundu déle).
	- _Problém:_ Paket se ztratil.
	- _Middleware řešení:_ **Retry logic.**