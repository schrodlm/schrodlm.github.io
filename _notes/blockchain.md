**Blockchain** je **technologie postavená na [P2P architektuře](/notes/peer-to-peer-p2p/)**, která využívá specifickou datovou strukturu k udržování distribuované účetní knihy (distributed ledger).

### Na čem je postaven? (Architektura)

Blockchain běží v **peer-to-peer (P2P)** síti, což je jeho základní architektonický pilíř.

- **Decentralizace:** Na rozdíl od klasických databází neexistuje žádný centrální server. Všechny uzly v síti jsou si rovny a každý z nich může udržovat identickou kopii celého záznamu.
    
- **Robustnost:** Pokud jeden uzel vypadne, systém funguje dál, protože data jsou replikována na tisících dalších uzlů.
    
- **Vrstvy blockchainu:** Technicky se architektura dělí do několika vrstev:
    - **Síťová vrstva (P2P):** Zajišťuje komunikaci mezi uzly a šíření nových transakcí.
    - **Datová vrstva:** Definuje strukturu bloků a transakcí.
    - **Konsenzuální vrstva:** Nejdůležitější část, kde se uzly shodují na pořadí a pravosti bloků
---
### Jak fungují bloky

Pojem blockchain doslova znamená „řetězec bloků“. Jeho integrita je založena na **kryptografických haších**.

- **Obsah bloku:** Každý blok obsahuje sadu transakcí, časové razítko a **hash předchozího bloku**.
- **Propojení:** Tím, že každý blok „ukazuje“ na hash toho předchozího, vzniká nezměnitelný řetězec.
- **Nezměnitelnost:** Pokud by někdo chtěl změnit data v bloku č. 5, změní se jeho hash. Protože blok č. 6 obsahuje hash bloku č. 5, musel by útočník změnit i ten, a následně všechny bloky až do konce řetězce, což je díky mechanismu konsenzu (např. PoW) prakticky nemožné.

---

### Logika fungování v krocích

1. **Vznik transakce:** Uživatel pošle digitální aktivum (např. Bitcoin).
2. **Šíření (P2P):** Transakce se rozletí po síti k ostatním uzlům.
3. **Ověření:** Uzly zkontrolují, zda je transakce platná (např. zda má uživatel dostatek prostředků v UTXO modelu).
4. **Vytvoření bloku:** Těžaři/Validátoři seskupí platné transakce do nového bloku.
5. **Konsenzus:** Proběhne proces shody (např. Proof of Work), který určí, že tento blok je ten pravý.
6. **Zápis:** Blok je přidán na konec řetězce a synchronizován s ostatními uzly.

> [!tip] **Shrnutí pro DS:** Blockchain je v podstatě [replikovaný stavový automat](/notes/state-machine-replication-smr/), který místo klasického lídra (jako v Raftu) využívá decentralizovaný konsenzus a kryptografické vazby k tomu, aby zajistil shodu v masivním měřítku.