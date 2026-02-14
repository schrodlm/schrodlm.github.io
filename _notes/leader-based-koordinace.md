Tento mechanismus je jedním ze základních návrhových vzorů koordinace. Jeho podstata spočívá v tom, že jeden uzel v rámci skupiny procesů přijímá roli **vůdce (leadera)** a stává se jediným rozhodovacím bodem pro zbytek systému.

>[!note] Kdy se používá
>Leader-based koordinace se volí tam, kde je prioritou **silná konzistence** a jednoduchost řízení stavu. Je to přímý protiklad k plně decentralizovaným (P2P) schématům.
### Klíčové role
- **Leader (Vůdce / Coordinator / Primary):** Jediný uzel, který rozhoduje o globálním stavu a pořadí operací
- **Followers (Následníci / Replicas / Backups):** Uzly, které přijímají rozhodnutí od leadera a replikují jeho stav.
### 2. Princip fungování
1. **Směrování požadavků:** Všechny požadavky od klientů, které modifikují stav systému, musí být směrovány a zpracovány leaderem.
2. **Jediný zdroj pravdy:** Leader určuje pořadí, v jakém dochází k modifikacím dat.
3. **Replikace:** Leader je zodpovědný za replikaci dat nebo záznamů (logů) na všechny ostatní uzly.
4. **Potvrzení (Commitment):** Leader rozhodne, kdy je zápis bezpečně uložen (obvykle po replikaci na většinu/kvórum) a teprve pak jej aplikuje na stav systému.
## Výhody a nevýhody
| **Výhody**                                                                                              | **Nevýhody**                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Jednoduchost:** Odpadají složité konflikty, které vznikají, když se o změnu pokouší více uzlů naráz9. | **Bottleneck (Úzké hrdlo):** Leader musí zpracovat všechny zápisy, což může omezovat výkon systému.                  |
| **Silná konzistence:** Snadno se vynucuje jednotné pořadí operací napříč replikami11.                   | **SPOF (Single Point of Failure):** Pokud leader selže, systém nemůže pokračovat v zápisech, dokud není zvolen nový. |
| **Rychlost rozhodování:** Leader nemusí vyjednávat s každým uzlem o každém kroku zvlášť.                | **Závislost na síti:** Izolace leadera od sítě (partition) způsobí zastavení systému.                                |

---
### Spolehlivost a volba leadera
Protože je leader kritickým bodem, systém musí obsahovat mechanismus pro jeho obnovu:

- **Detekce selhání:** Ostatní uzly sledují stav leadera (např. pomocí timeoutů).
- **[Volba koordinátora](/notes/volba-koordinatora-leader-election/):** Pokud leader selže, musí být okamžitě spuštěn algoritmus pro volbu nového

### Praktické příklady

- **[RAFT](/notes/raft/):** Typický leader-based algoritmus, kde uzel s aktuálním mandátem řídí replikaci logu.
- **[RPC](/notes/rpc/):** Samotný princip volání vzdálené procedury vytváří dočasný vztah klient-server (vůdce-následník) pro dané volání.
- **etcd / Consul:** Nástroje pro správu konfigurace (používané např. v Kubernetes), které využívají leader-based konsenzus pro udržení konzistence dat.
---
## Rozdíly s [token-based koordinací](/notes/token-based-koordinace/)
Přestože se tyto dva přístupy jeví podobně (alespoň mně) tak je mezi nimi velký rozdíl.

| **Vlastnost**       | **Leader-based**                         | **Token-based**                     |
| ------------------- | ---------------------------------------- | ----------------------------------- |
| **Kdo rozhoduje?**  | Jeden vyvolený uzel (Leader).            | Kdokoliv, kdo právě drží token.     |
| **Pohyb autority**  | Autorita je fixní, dokud leader neselže. | Autorita neustále koluje mezi uzly. |
| **Hlavní cíl**      | **Konzistence** a shoda na stavu         | **Férovost** a vyloučení konfliktů. |
| **Typický příklad** | **RAFT**, Paxos.                         | **Token Ring**, Rate Limiting.      |