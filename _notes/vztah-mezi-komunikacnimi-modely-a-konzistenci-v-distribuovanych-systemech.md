Komunikační modely a konzistence spolu úzce souvisí - **způsob, jakým si komponenty distribuovaného systému vyměňují zprávy, přímo ovlivňuje, jaké záruky konzistence můžete poskytovat**.

## Základní princip
Konzistence je o tom, **jaký pohled na data mají různé části systému**. Komunikační model určuje, **jak rychle a v jakém pořadí se informace o změnách šíří**. Tento princip popisuje [CAP theorem](/notes/cap-theorem/) a úzce s tímto tématem souvisí.

---
## Konkrétní souvislosti
**Synchronní komunikace → Silnější konzistence**
- Když klient čeká na potvrzení od všech replik, můžete garantovat linearizabilitu
- Máte jistotu, že operace jsou aplikovány v konzistentním pořadí
- Ale platíte za to vyšší latencí a nižší dostupností

**Asynchronní komunikace → Slabší konzistence**
- Zprávy přichází v různém pořadí, mohou se zpozdit nebo ztratit
- Různé repliky mohou mít dočasně odlišný pohled na data
- Typicky vedou k eventual consistency nebo kauzální konzistenci
- Výhodou je nižší latence a vyšší dostupnost