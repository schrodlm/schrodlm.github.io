CAS (compare-and-swap) je atomická instrukce, používaná k dosažení synchronizace

- Přijímá registr $R$, očekávanou hodnotu `old` a novou hodnotu `new`.
- **Princip:** Pokud $R==old$, nastaví $R\leftarrow new$. V opačném případě $R$ nemění. Vždy vrátí původní hodnotu $R$.

Umožňuje detekovat, zda jiný proces změnil hodnotu během naší přípravy dat.
>[!important] Pozor
Vzniká zde [ABA problém](/notes/aba-problem/)