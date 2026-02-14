Spolehlivost je jedna z garancí definovaných [komunikační model](/notes/komunikacni-model/) distribuovaného systému. Definuje, jak moc se systém snaží doručit zprávu a jaké garance poskytuje.

## Typy delivery semantics
### at-most-once semantics
- **Princip:** Garance, že se operace neprovede více než jednou (ale nemusí se provést vůbec).
- **Implementace:** Deduplikace na straně serveru (např. request ID, sequence number).
- **Garance:** Operace proběhla nanejvýš jednou; klient si nemusí být jistý, zda proběhla.
- **Použití:** Operace, kde je horší provést akci dvakrát než ji neprovést vůbec.
### at-least-once semantics
- **Princip:** Klient opakuje požadavek, dokud nedostane potvrzení.
- **Garance:** Operace proběhla alespoň jednou, ale může proběhnout vícekrát.
- **Riziko:** Zde je právě nutná **[idempotence](/notes/idempotence/)**. Pokud operace není idempotentní, systém je nekonzistentní. See [idempotence v RPC](/notes/idempotence-v-rpc/).
- **Použití:** Tam, kde je doručení důležité, ale opakování nevadí (čtení dat).
## exactly-once semantics
**Princip:** Ideální (teoretická) garance, že se operace provede **právě jednou**:
- ani se neztratí
- ani se neprovede vícekrát

Klient i server se shodnou, že operace proběhla **jednoznačně a přesně jednou**.
![Image](/assets/img/Pasted image 20260116123459.png)
