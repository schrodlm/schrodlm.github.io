Inspirovány šířením virů. Slouží k dosažení eventual consistency v masivních systémech (např. Cassandra).

**Anti-Entropy**
- Uzly si náhodně vybírají partnery a synchronizují kompletní stav. Zaručuje konvergenci, ale je náročné na data.
	- Push: "Tady jsou moje data." (Efektivní na začátku šíření).
	- Pull: "Dej mi svá data." (Efektivní na konci, když má většina aktuální data a jen pár uzlů zaostává).

## Rumor Mongering (Šíření drbů)
Uzel šíří novou aktualizaci ("drb") náhodným sousedům. Pokud narazí na souseda, který drb už zná, s určitou pravděpodobností přestane drb šířit (ztrácí zájem). Je to velmi rychlé, ale existuje nenulová pravděpodobnost, že se drb nedostane ke všem.

**Anti-entropy (Antientropie):** To je "záchranná síť". Uzly si v pravidelných (ale delších) intervalech náhodně vybírají jiný uzel a porovnávají si s ním **celý svůj stav** (např. pomocí Merkleho stromů). Pokud zjistí, že jim něco chybí, synchronizují se.

> _Antientropie zaručuje, že i když Rumor Mongering selhal, uzel se informaci dříve či později dozví._

---
## Problém mazání dat
Bez speciálního mechanismu by v epidemických protokolech smazání dat nefungovalo. Nastala by tato situace "zmrtvýchvstání":

1. **Uzel A** smaže položku X.
2. **Uzel B** o smazání ještě neví a stále má starou kopii položky X.
3. **Uzel B** kontaktuje **Uzel A**, aby si vyměnili novinky (gossip).
4. **Uzel A** uvidí, že B má data (X), která on sám v paměti nemá.
5. **Uzel A** usoudí, že jde o nová data, která mu chybí, a položku X si znovu vytvoří.
6. **Výsledek:** Smazaná data "vstala z mrtvých" a šíří se systémem dál.
    
### Řešení: Tombstones (Náhrobní kameny)

Aby systém věděl, že data byla smazána záměrně, nemůžeme je prostě odstranit. Musíme je nahradit speciální značkou.

- **Princip:** Místo fyzického smazání dat se záznam v databázi označí příznakem **"deleted"** (tento příznak se nazývá _tombstone_).
    
- **Šíření:** Tento "náhrobní kámen" se pak systémem šíří úplně stejně jako běžná aktualizace dat. Ostatní uzly díky němu pochopí, že mají data také označit za smazaná, a ne je znovu nabízet k replikaci.