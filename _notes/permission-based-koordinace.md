---
tags:
  - distributed_system
  - coordination_mechanism
language: czech
title: "permission-based koordinace"
---
Jeden z [mechanismů koordinace v distrbuovaných systémech](/notes/mechanismy-koordinace-v-distribuovanych-systemech.html)

---
## Princip
Proces musí **explicitně požádat ostatní procesy o souhlas** před vykonáním kritické akce. Pokračuje až po obdržení potvrzení od **všech** relevantních procesů.

**Klíčová myšlenka:**
> Žádné centrální řízení, žádný token. Každý se ptá všech ostatních: "Můžu?"
---
## Jak to funguje
### Základní průběh

1. **REQUEST:** Proces Pi chce do CS → rozešle `REQUEST(timestamp)` **všem** ostatním procesům
2. **Hlasování:** Každý proces obdrží žádost a rozhodne se:
   - **GRANT** (povoleno) - pokud sám nechce do CS nebo má nižší prioritu
   - **DEFER** (odložit odpověď) - pokud sám chce do CS a má vyšší prioritu
3. **Čekání:** Pi čeká, až dostane **GRANT od všech** N-1 procesů
4. **Vstup:** Teprve pak Pi vstoupí do kritické sekce
5. **RELEASE:** Po opuštění CS pošle Pi všem procesům `RELEASE`, aby uvolnil jejich hlasy
### Rozhodování o prioritě ([logický čas](/notes/logicky-cas.html))
```
if dostanu REQUEST(Tj) od Pj:
  if nechci_do_CS:
    pošli GRANT(Pj)
  elif chci_do_CS and (Ti < Tj or (Ti == Tj and i < j)):
    odlož_odpověď(Pj)  # Já mám přednost
  else:
    pošli GRANT(Pj)     # Pj má přednost
```
**Důležité:** Porovnává se **Lamportův timestamp** (logický čas) + process ID jako tiebreaker.

---
## Varianty

### 1. Ricart-Agrawala Algorithm (klasika)
**Optimalizace oproti naivnímu přístupu:**
- Nepošle explicitní GRANT, pokud nechce do CS → **implicitní souhlas**
- Odloží odpověď, jen pokud sám soutěží o CS
- **Počet zpráv:** 2(N-1) per vstup do CS

```
Proces Pi chce do CS:
  Ti = Lamport_timestamp++
  pošli REQUEST(Ti) všem
  čekej na (N-1) GRANT
  vstup_do_CS()
  opusť_CS()
  pošli odložené GRANTy
```

### 2. Naivní Permission-based (3-fázový)
- Explicitní GRANT od všech
- **Počet zpráv:** 3(N-1) - REQUEST, GRANT, RELEASE

### 3. [Maekawa's algorithm](/notes/maekawas-algorithm.html) (quorum, ne čistý permission)
- Žádá jen **podmnožinu** (√N) procesů → viz [quorum-based koordinace](/notes/quorum-based-koordinace.html)

---
## Vlastnosti

### Výhody
**1. Plně distribuovaný**
- Žádný centrální bod selhání
- Žádný token k údržbě nebo regeneraci
- Symetrický (všichni procesy mají stejnou roli)

**2. Férové uspořádání**
- Lamportovy timestampy zajišťují totální uspořádání žádostí
- Proces s nejstarší žádostí má vždy přednost
- **FIFO garance**: Žádosti jsou vyřizovány v pořadí, jak vznikly (globálně)

**3. Žádné ztracené tokeny**
- Není co ztratit
- Jednodušší reasoning o správnosti

**4. Dobrá pro malé systémy**
- Přímočarý, srozumitelný algoritmus

### Nevýhody

**1. Vysoký počet zpráv**
- **O(N) zpráv per vstup** do CS (kde N = počet procesů)
- Pro 100 procesů = 200 zpráv na jeden vstup
- Neškálovatelné pro velké systémy

**2. Všichni musí odpovědět**
- Jedna pomalá replika zpomalí **všechny** procesy
- Vysoká latence v heterogenních systémech

**3. Nízká odolnost vůči výpadkům**
- Pokud **jeden** proces spadne → celý systém zamrzne
- Všichni čekají na odpověď, která nikdy nepřijde
- Potřeba [failure detection](/notes/detekce-selhani-failure-detection.html) a recovery

**4. Režie při nízké konkurenci**
- I když nikdo nesoutěží, musíš poslat N zpráv
- Neefektivní, pokud je CS zřídka používaná

---
## Použití v praxi

### 1. [Mutual Exclusion](/notes/vzajemne-vylouceni-v-distribuovanych-systemech.html)

**Ricart-Agrawala Algorithm:**

```python
class Process:
  def request_CS(self):
    self.timestamp = lamport_clock.tick()
    self.state = REQUESTING
    
    # Rozešli REQUEST všem
    for p in other_processes:
      send(p, REQUEST(self.id, self.timestamp))
    
    # Čekej na N-1 odpovědí
    wait_for_grants(N - 1)
    
    self.state = IN_CS
    enter_critical_section()
  
  def on_receive_request(self, sender, timestamp):
    lamport_clock.update(timestamp)
    
    if self.state == IN_CS or \
       (self.state == REQUESTING and self.timestamp < timestamp):
      # Odlož odpověď
      deferred_queue.append(sender)
    else:
      # Pošli GRANT okamžitě
      send(sender, GRANT(self.id))
  
  def release_CS(self):
    self.state = RELEASED
    
    # Pošli odložené GRANTy
    for p in deferred_queue:
      send(p, GRANT(self.id))
    deferred_queue.clear()
```

### 2. [Distributed Consensus](/notes/konsenzus-v-distribuovanych-systemech.html)
**Two-Phase Commit (2PC):**
- Koordinátor se ptá všech účastníků: "Můžeme commitnout?"
- Všichni musí odpovědět ANO → teprve pak commit
- Permission-based pattern
### 3. Total Order Multicast
**ISIS Algorithm:**
- Odesílatel broadcastuje zprávu
- Čeká na **navrhovaná sekvenční čísla** od všech
- Vybere maximum → to je finální pořadí
- Permission-based (žádá všechny o číslo)

---

## Problémy a řešení
### Problém 1: Pád procesu
**Problém:** Pokud proces Pj spadne, všichni čekají navždy na jeho GRANT.

**Řešení 1: Timeouts + Failure Detection**
```python
if not received_grant(Pj) and timeout_elapsed():
  if failure_detector.is_failed(Pj):
    # Považuj Pj za mrtvý, ignoruj jeho hlas
    continue_without(Pj)
  else:
    # Pošli znovu
    resend_request(Pj)
```
**Řešení 2: Group Membership**
- Udržuj aktuální seznam živých procesů
- Žádej jen živé členy
- Když Pj spadne → odstraň ho ze skupiny

### Problém 2: Nekonečné čekání při souběžných žádostech
**Příklad:**
- P1 žádá P2 (timestamp T1)
- P2 žádá P1 (timestamp T2)
- Oba odloží odpověď → **deadlock**?

**Řešení:** [logický čas](/notes/logicky-cas.html) + deterministické uspořádání
```
if T1 < T2:  P1 má přednost, P2 pošle GRANT
elif T1 > T2: P2 má přednost, P1 pošle GRANT
elif T1 == T2 and i < j: Pi má přednost (deterministické)
```
→ Vždy jeden dostane přednost → deadlock nemůže nastat

### Problém 3: Vysoká latence

**Problém:** Čekání na všech N procesů = latence nejpomalejšího

**Řešení:** Použij [quorum-based](/notes/quorum-based-koordinace.html) místo permission-based
- Stačí většina (N/2 + 1) odpovědí
- Trade-off: Složitější logika, ale nižší latence

---

## Srovnání s ostatními mechanismy

| Vlastnost | Permission | [token-based koordinace](/notes/token-based-koordinace.html) | [quorum-based koordinace](/notes/quorum-based-koordinace.html)|
|-----------|------------|---------|--------|
| Počet zpráv | **O(N)** ❌ | O(1) ✅ | O(√N) 🟡 |
| Odolnost vůči výpadkům | 🟡 Nízká-střední | ❌ Nízká | ✅ Vysoká |
| Latence | ❌ N × RTT | 🟡 Závisí | 🟡 √N × RTT |
| Férové uspořádání | ✅ Lamport TS | 🟡 Závisí | ✅ Lamport TS |
| Složitost | 🟡 Střední | ✅ Nízká | ❌ Vysoká |
| Centralizace | ✅ Žádná | ❌ Token je SPOF | ✅ Žádná |

---

## Optimalizace
### 1. Implicitní GRANT (Ricart-Agrawala)

**Místo:**
```
REQUEST → GRANT → RELEASE
```

**Použij:**
```
REQUEST → (implicitní souhlas pokud nechci CS) → RELEASE
```
→ Ušetříš N zpráv

### 2. Broadcast místo unicast

**Pokud máš reliable multicast:**
```python
# Místo N unicastů
for p in processes:
  send(p, REQUEST)

# Použij broadcast
broadcast(REQUEST)  # 1 zpráva místo N
```

### 3. Voting Sets ([Maekawa's algorithm](/notes/maekawas-algorithm.html))
- Místo všech N procesů žádej jen √N
- Zachováš férové uspořádání, snížíš počet zpráv

---

## Kdy použít Permission-based?

**Dobré pro:**
- Malé až střední systémy (N < 50)
- Potřebuješ **férové uspořádání** (FIFO dle timestampu)
- Chceš plně distribuované řešení bez centrálního bodu
- Procesy jsou většinou spolehlivé

❌ **Nepoužívej pro:**
- Velké systémy (N > 100) → příliš mnoho zpráv
- Nestabilní prostředí s častými výpadky
- Heterogenní systémy (některé procesy velmi pomalé)
- Vysoká konkurence → neustálé bombardování žádostmi

---

## Příklady z praxe
**1. Distributed Databases:**
- Timestamp-based concurrency control
- Permission pattern pro validaci transakcí

**3. Distributed File Systems:**
- Koordinace přístupu k souborům
- Permission od všech replik před zápisem

---

## Vztah k [logickému času](/notes/logicky-cas.html)

Permission-based algoritmy **kriticky závisí** na Lamportových timestampech:

1. **Totální uspořádání:** (T, PID) vytváří úplné uspořádání událostí
2. **Férové rozhodování:** Starší timestamp = vyšší priorita
3. **Deadlock prevence:** Deterministické rozhodnutí při konfliktu

**Bez logického času** by permission-based nefungoval!

---

## Související pojmy

- [mechanismy koordinace v distribuovaných systémech](/notes/mechanismy-koordinace-v-distribuovanych-systemech.html)
- [vzájemné vyloučení v distribuovaných systémech](/notes/vzajemne-vylouceni-v-distribuovanych-systemech.html)
- Lamportovy hodiny
- [konsenzus v distribuovaných systémech](/notes/konsenzus-v-distribuovanych-systemech.html)
- [detekce selhání (failure detection)](/notes/detekce-selhani-failure-detection.html)