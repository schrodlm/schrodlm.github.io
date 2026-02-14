---
layout: note
title: "TOCTTOU"
---

TOCTTOU (Time-of-check to time-of-use) je typ **[race condition](/notes/race-condition.html)**, kdy se stav systému změní mezi okamžikem, kdy OS nebo aplikace něco zkontroluje, a okamžikem, kdy tuto informaci použije.

## Proč k tomu dochází
Problém je v tom, že operace v systémech často nejsou **atomické**.
1. **Check (lstat):** Program se ptá: _"Je soubor `/home/user/inbox` vlastněn uživatelem?"_ OS odpoví: _"Ano."_
2. **Gap:** Mezitím útočník provede příkaz `ln -sf /etc/passwd /home/user/inbox`. Původní soubor nahradí symlinkem na citlivý soubor.
3. **Use (open/write):** Program (běžící jako root) otevře `/home/user/inbox`. Protože už si "ověřil", že je to bezpečné, nevšimne si, že teď zapisuje do `/etc/passwd`.

### Příklad
Mějme mailový servis, který běží s root právama (může tedy přistoupit k jakémukoliv souboru). Tento servis přidá přijmutou zprávu to uživatelovo inboxu tímto způsobem: 
1. Zavolá `lstat()` aby získal informace o souboru (a aby se ujistil, že je to soubor, který je vlastněn uživatelem)
2. Pokud krok 1 uspěje, server aktualizuje soubor s novou zprávou

Během kroku 1 a 2 je mezera, kterou může využít útočník, utočník je v tomto případě příjemce zprávy. Nastaví si inbox tak aby to byl citlivý soubor (třeba `/etc/passwd`). Pokud toto přenastavení provede v tu správnou chvíli, server aktualizuje `/etc/passwd` s root právama a dostane přístup k systému.