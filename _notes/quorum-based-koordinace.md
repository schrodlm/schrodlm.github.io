---
tags:
  - distributed_system
  - coordination_mechanism
language: czech
title: "quorum-based koordinace"
layout: note
---
Jeden z [mechanismů koordinace v distrbuovaných systémech](/notes/mechanismy-koordinace-v-distribuovanych-systemech.html)

---

## Princip

Proces potřebuje souhlas **podmnožiny (quora)** procesů, ne všech. Klíčem je **průniková vlastnost**: libovolná dvě quora se musí překrývat alespoň v jednom uzlu.

**Klíčová myšlenka:**
> Nepotřebuješ všechny. Stačí ti "dost" procesů, ale tak, aby se žádná dvě quora nepřekrývala. Překryv = koordinace.

---

## Matematický základ

### Průniková vlastnost (Intersection Property)

Pro hlasovací množiny $V_1, V_2, \ldots, V_n$ musí platit:

$$V_i \cap V_j \neq \emptyset \quad (\forall i, j)$$

**Proč?** Pokud se dvě quora překrývají, alespoň jeden proces je v obou → ten zajistí **koordinaci** (nemůže dát hlas dvěma různým žadatelům současně).

### Velikost quor

Existuje **trade-off** mezi velikostí quora a počtem zpráv:

| Typ quora | Velikost | Použití |
|-----------|----------|---------|
| **Majority (většina)** | $\lceil \frac{N+1}{2} \rceil$ | Paxos, Raft, Dynamo |
| **Grid-based (√N)** | $2\sqrt{N} - 1$ | Maekawa algorithm |
| **Read/Write quora** | $R + W > N, W > \frac{N}{2}$ | Replicated databases |
| **Weighted quorum** | $\sum w_i > \frac{W}{2}$ | Uzly s různými vahami |

---
## Jak to funguje

### Základní průběh ([Maekawa's algorithm](/notes/maekawas-algorithm.html)-style)

1. **Sestavení quor:** Každý proces $P_i$ má přiřazenou hlasovací množinu $V_i$
2. **REQUEST:** $P_i$ chce do CS → pošle `REQUEST(timestamp)` **jen členům $V_i$** (ne všem!)
3. **Hlasování:** Uzly v $V_i$ rozhodují:
   - Pokud ještě nikomu nedaly hlas → pošlou `VOTE`
   - Pokud už hlas daly → žádost **zařadí do fronty**
4. **Locked vote:** Uzel je "locked" pro jednoho kandidáta dokud nedostane `RELEASE`
5. **Čekání:** $P_i$ čeká na `VOTE` od **všech** členů svého quora $V_i$
6. **Vstup:** Teprve pak $P_i$ vstoupí do kritické sekce
7. **RELEASE:** Po opuštění CS pošle $P_i$ zprávu `RELEASE` členům $V_i$
8. **Další ve frontě:** Uzly uvolní hlas a pošlou `VOTE` dalšímu čekajícímu

---

## Typy quor

### 1. Majority Quorum (Většinové hlasování)
**Definice:** $Q = \{$ libovolná podmnožina s $> \frac{N}{2}$ uzly $\}$

**Důkaz průniku:**
- Máme N uzlů celkem
- Quorum 1: $|Q_1| > \frac{N}{2}$
- Quorum 2: $|Q_2| > \frac{N}{2}$
- $|Q_1| + |Q_2| > N$ → musí se překrývat! ✓

**Vlastnosti:**
- Nejjednodušší na implementaci
- Maximální odolnost: toleruje $\lfloor \frac{N-1}{2} \rfloor$ výpadků
- ❌ Velikost quora: $\lceil \frac{N+1}{2} \rceil$ (poměrně velké)

**Použití:**
- [paxos](/notes/paxos.html), [RAFT](/notes/raft.html)
- [Distributed databases](/notes/replikace.html)

### 2. Grid-based Quorum (√N × √N mřížka)
**Definice:** Uspořádej N uzlů do $\sqrt{N} \times \sqrt{N}$ matice.
- Quorum pro $P_i$ = **celý jeho řádek + celý jeho sloupec**

**Příklad (9 uzlů):**
```
    C1  C2  C3
R1 [ 1][ 2][ 3]
R2 [ 4][ 5][ 6]
R3 [ 7][ 8][ 9]

P5 má quorum: {4, 5, 6, 2, 5, 8} = {2, 4, 5, 6, 8}
```

**Důkaz průniku:**
- $V_i$ = řádek i + sloupec i
- $V_j$ = řádek j + sloupec j
- Pokud $i \neq j$: $V_i$ a $V_j$ se protínají v buňce [řádek_i, sloupec_j] nebo [řádek_j, sloupec_i] ✓

**Vlastnosti:**
- Velikost quora: $2\sqrt{N} - 1$ (menší než majority!)
- Lepší škálovatelnost (pro velké N)
- ❌ Složitější na konstrukci
- ❌ Méně odolný vůči výpadkům (jeden výpadek může blokovat celý řádek/sloupec)

**Použití:**
- [Maekawa algorithm](/notes/vzajemne-vylouceni-v-distribuovanych-systemech.html)

### 3. Read/Write Quorum (Dynamo-style)

**Definice:**
- Read quorum: $Q_R$ uzlů
- Write quorum: $Q_W$ uzlů
- **Podmínky:** $Q_R + Q_W > N$ a $Q_W > \frac{N}{2}$

**Příklad:**
- N = 10 replik
- $Q_W = 6$ (write quorum)
- $Q_R = 5$ (read quorum)
- $6 + 5 = 11 > 10$ ✓ (zajištěn překryp)

**Vlastnosti:**
- ✅ Asymetrické quora → optimalizace pro read-heavy nebo write-heavy workloady
- ✅ Trade-off mezi latencí čtení a zápisu
- Read-heavy: malé $Q_R$, velké $Q_W$ (rychlé čtení)
- Write-heavy: malé $Q_W$, velké $Q_R$ (rychlý zápis)

**Použití:**
- [replikace](/notes/replikace.html)
- Distributed key-value stores

### 4. Weighted Quorum

**Definice:** Uzlům přiřadíme váhy $w_1, w_2, \ldots, w_N$
- Quorum = množina s $\sum w_i > \frac{W}{2}$ (kde $W = \sum_{i=1}^{N} w_i$)

**Příklad:**
```
Node 1: w=3 (silný server)
Node 2: w=3 (silný server)
Node 3: w=1 (slabý server)
Node 4: w=1 (slabý server)
W = 8 celkem

Validní quora:
{1, 2} → 6 > 4 ✓
{1, 3, 4} → 5 > 4 ✓
{2, 3, 4} → 5 > 4 ✓
```

**Použití:**
- Heterogenní systémy (různě výkonné uzly)
- Geo-distributed systémy (datové centrum má vyšší váhu než edge node)

---
## Vlastnosti
### Výhody

**1. Menší počet zpráv než permission-based**
- Permission: O(N) zpráv
- Majority quorum: O(N/2) zpráv
- Grid quorum: O(√N) zpráv

**2. Vysoká odolnost vůči výpadkům**
- Majority quorum toleruje $\lfloor \frac{N-1}{2} \rfloor$ výpadků
- Systém zůstává dostupný i při částečných výpadcích

**3. Flexibilita**
- Různé velikosti quor → různé trade-offy
- Read/write quora → optimalizace pro konkrétní workload
- Weighted quora → heterogenní prostředí

**4. Paralelismus**
- Můžeš mít více quor současně (pokud se nepřekrývají v akci)
- Např. různé klíče v Cassandra = různá quora

### Nevýhody

**1. Složitá konstrukce quor**
- Jak vybrat optimální quora?
- Grid vyžaduje $N = k^2$ (ideálně)
- Potřeba algoritmu pro generování quor

**2. Stále potřebuješ celé quorum**
- I když quorum je menší než N, musíš dostat odpověď od **všech** v quoru
- Jeden pomalý uzel v quoru = celé quorum čeká

**3. Riziko deadlocku (Maekawa)**
- Dva procesy mohou mít quora, která se vzájemně blokují
- Potřeba **INQUIRE/YIELD** mechanismu pro řešení

**4. Složitější reasoning o korektnosti**
- Důkazy průniku nejsou triviální
- Chyba v konstrukci quor = broken safety

---

## Použití v praxi

### 1. [Mutual Exclusion - Maekawa](/notes/vzajemne-vylouceni-v-distribuovanych-systemech.html)
```python
class MaekawaProcess:
  def request_CS(self):
    self.timestamp = lamport_clock.tick()
    
    # Pošli REQUEST jen svému quoru
    for node in my_voting_set:
      send(node, REQUEST(self.id, self.timestamp))
    
    # Čekej na VOTE od všech v quoru
    wait_for_votes(len(my_voting_set))
    enter_critical_section()
  
  def on_receive_request(self, sender, timestamp):
    if not self.voted_for:
      # Nemám aktivní VOTE → dám hlas
      self.voted_for = sender
      send(sender, VOTE(self.id))
    else:
      # Už jsem dal hlas → zařaď do fronty
      self.request_queue.append((sender, timestamp))
      
      # Deadlock prevention: INQUIRE
      if timestamp < self.my_timestamp:
        send(self.voted_for, INQUIRE())
  
  def release_CS(self):
    for node in my_voting_set:
      send(node, RELEASE(self.id))
  
  def on_receive_release(self, sender):
    self.voted_for = None
    
    # Dej hlas prvnímu ve frontě
    if self.request_queue:
      next_requester = self.request_queue.pop(0)
      self.voted_for = next_requester
      send(next_requester, VOTE(self.id))
```

### 2. [paxos](/notes/paxos.html)
**Phase 1: Prepare**
```python
def propose(value):
  proposal_number = generate_unique_number()
  
  # Pošli PREPARE majority quoru
  for node in majority_quorum():
    send(node, PREPARE(proposal_number))
  
  # Čekej na PROMISE od majority
  promises = wait_for_majority_promises()
  
  # Vyber hodnotu (nejnovější nebo svou)
  final_value = choose_value(promises, value)
```

**Phase 2: Accept**
```python
  # Pošli ACCEPT majority quoru
  for node in majority_quorum():
    send(node, ACCEPT(proposal_number, final_value))
  
  # Čekej na ACCEPTED od majority
  if received_majority_accepts():
    return CHOSEN(final_value)
```

### 3. [replikace](/notes/replikace.html)

**Write (W=3 z N=5):**
```python
def put(key, value):
  # Najdi preference list pro klíč
  replicas = consistent_hash.get_replicas(key, N=5)
  
  # Piš na všech 5, čekej na 3
  version = vector_clock.increment()
  for replica in replicas:
    async_write(replica, key, value, version)
  
  # Čekej na W=3 potvrzení
  wait_for_acks(W=3)
  return SUCCESS
```

**Read (R=2 z N=5):**
```python
def get(key):
  replicas = consistent_hash.get_replicas(key, N=5)
  
  # Čti z R=2 replik
  responses = []
  for replica in replicas[:R]:
    responses.append(read(replica, key))
  
  # Vyber nejnovější verzi (vector clock)
  return resolve_conflicts(responses)
```
---
## Problémy a řešení
### Problém 1: Optimální konstrukce quor

**Problém:** Jak sestavit quora pro grid, pokud $N \neq k^2$?

**Řešení 1: Padding**
```
N = 10 → nejbližší čtverec = 16
Přidej 6 "dummy" uzlů
```

**Řešení 2: Asymetrické quora**
```
N = 10 → 3×4 grid (nemusí být čtvercové)
Některá quora jsou větší než jiná
```

**Řešení 3: Projective planes (pokročilé)**
- Matematické konstrukce s optimálními vlastnostmi
- Každé quorum má stejnou velikost
- Každé dva uzly sdílejí právě jedno quorum

### Problém 3: Dynamické členství

**Problém:** Co když se N mění (uzly přibývají/ubývají)?

**Řešení v Paxos/Raft:**
- **Konfigurace jako konsenzus hodnota**
- Změna členství = speciální proposal
- Používá "joint consensus" (stará + nová konfigurace současně)
---

## Srovnání s ostatními mechanismy

| Vlastnost              | Quorum                      | [permission-based koordinace](/notes/permission-based-koordinace.html)  | [token-based koordinace](/notes/token-based-koordinace.html) |
| ---------------------- | --------------------------- | ----------------------------- | ------------- | ------------------------ | ------- |
| Počet zpráv            | **O(√N) - O(N/2)** 🟡       | O(N) ❌                        | O(1) ✅        |                          |         |
| Odolnost vůči výpadkům | **✅ Vysoká** (majority)     | 🟡 Nízká                      | ❌ Velmi nízká |                          |         |
| Latence                | 🟡 Střední (čeká na quorum) | ❌ Vysoká (čeká na všechny)    | 🟡 Závisí     |                          |         |
| Složitost              | **❌ Vysoká**                | 🟡 Střední                    | ✅ Nízká       |                          |         |
| Férové uspořádání      | ✅ Ano (timestamp)           | ✅ Ano                         | 🟡 Závisí     |                          |         |
| Flexibilita            | **✅ Velmi vysoká**          | ❌ Nízká                       | ❌ Nízká       |                          |         |

---

## Trade-offs při výběru velikosti quora

### Malé quorum (např. R=1, W=N)

**Výhody:**
- ✅ Rychlé čtení
- ✅ Nízká latence pro reads

**Nevýhody:**
- ❌ Pomalý zápis (musíš čekat na všechny)
- ❌ Nízká dostupnost pro writes

### Velké quorum (např. R=N, W=1)

**Výhody:**
- Rychlý zápis
- Vysoká dostupnost pro writes

**Nevýhody:**
- Pomalé čtení (musíš čekat na všechny)
- Můžeš číst zastaralá data

### Majority quorum (R=W=⌈(N+1)/2⌉)

**Vyvážený trade-off:**
- 🟡 Střední latence pro oboje
- ✅ Zajištěná konzistence (overlap)
- ✅ Maximální odolnost (toleruje ⌊(N-1)/2⌋ výpadků)

---

## Kdy použít Quorum-based?

**Dobré pro:**
- **Velké systémy** (N > 50) → √N je výrazně menší než N
- **Replikované databáze** → Dynamo, Cassandra
- **Konsenzus** → Paxos, Raft
- **Vysoká dostupnost** → tolerování výpadků
- **Geo-distributed systémy** → různá quora pro různé regiony

**Nepoužívej pro:**
- Velmi malé systémy (N < 10) → overhead není worth it
- Real-time systémy s tvrdými deadlinami → nepředvídatelná latence
- Když potřebuješ absolutní konzistenci všech replik → použij 2PC/3PC

---

## Příklady z praxe

**1. Amazon Dynamo:**
- Sloppy quorum (ne striktní majority)
- Hinted handoff při výpadcích
- N=3, R=2, W=2 (typické nastavení)

**2. Apache Cassandra:**
- Tunable consistency
- Quorum levels: ONE, QUORUM, ALL
- LOCAL_QUORUM pro geo-distribution

**4. etcd/Consul:**
- Raft konsenzus (majority quorum)
- Automatická failover při pádu leadera