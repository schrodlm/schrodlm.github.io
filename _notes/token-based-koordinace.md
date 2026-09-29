---
tags:
  - distributed_system
  - coordination_mechanism
language: czech
title: "token-based koordinace"
---
Jeden z [mechanismů koordinace v distrbuovaných systémech](/notes/mechanismy-koordinace-v-distribuovanych-systemech.html)

---
## Princip
Pouze **držitel speciálního tokenu** (unikátní zprávy/objektu) smí vykonat kritickou akci. Token je **unikátní** - v systému existuje právě jeden, který putuje mezi procesy.

**Klíčová myšlenka:** 
> Token = povolení. Kdo ho má, ten může.

---

## Jak to funguje
1. **Inicializace:** Jeden proces začíná s tokenem
2. **Čekání:** Proces bez tokenu musí počkat nebo si o něj požádat
3. **Akce:** Pouze držitel tokenu smí vstoupit do kritické sekce / provést akci
4. **Předání:** Po dokončení akce proces předá token dál:
   - Přímo dalšímu čekajícímu (na vyžádání)
   - Nebo zpět do "poolu" / v kruhu

---
## Varianty
### 1. Token Ring (jednoduchá verze)
```
P1 → P2 → P3 → P4 → P1
```
- Token obíhá v logickém kruhu
- I když nikdo nechce do CS, token pořád obíhá
- **Výhoda:** Férové, jednoduché
- **Nevýhoda:** Latence i při nízké konkurenci

### 2. Token on Request (dynamická verze)
- Token se posílá **jen na vyžádání**
- Proces pošle REQUEST držiteli tokenu
- Po dokončení CS se token pošle přímo žadateli
- **Výhoda:** Méně zpráv při nízké konkurenci
- **Nevýhoda:** Potřebuješ vědět, kdo má token

### 3. Tree-based Token (Raymond's algorithm)
```
        P1 (root)
       /  \
      P2   P3
     /  \
    P4   P5
```
- Procesy uspořádány do stromu
- Token putuje po hranách stromu
- Žádosti směřují směrem ke kořeni
- **Výhoda:** O(log N) zpráv pro přenos tokenu
- **Nevýhoda:** Složitější údržba stromu

---
## Vlastnosti
### Výhody

**1. Jednoduchá bezpečnost (Safety)**
- Maximálně jeden držitel = maximálně jeden v kritické sekci
- Žádné race conditions

**2. Nízký počet zpráv (při nízké konkurenci)**
- Token-based: 1 zpráva (předání tokenu)
- vs. Permission-based: N zpráv (žádosti všem)

**3. Žádná režie na povolení**
- Proces s tokenem má automaticky právo
- Nepotřebuje čekat na odpovědi

**4. Férové uspořádání (v některých variantách)**
- Token ring: FIFO pořadí
- Request queue: Časové razítko
### Nevýhody
**1. Single Point of Failure**
- Ztráta tokenu → celý systém zamrzne
- Potřeba **detekce ztráty** a **regenerace** tokenu
- Složité řešení: Jak poznat, že token chybí vs. někdo ho právě drží?

**2. Latence při čekání**
- I když nikdo CS nepoužívá, musíš čekat na token
- Token může být daleko (v kruhu, ve stromu)

**3. Neefektivní při nízké konkurenci**
- V token ring: Token pořád obíhá zbytečně
- Plýtvání zdroji

**4. Obtížná údržba**
- Co když proces s tokenem spadne?
- Jak regenerovat token bez duplikace?
- Jak zajistit, že existuje právě jeden?

---
## Použití v praxi

### 1. [Mutual Exclusion](/notes/vzajemne-vylouceni-v-distribuovanych-systemech.html)

**Token Ring Algorithm:**
```
while true:
  if mám_token and chci_do_CS:
    vstup_do_CS()
    opusť_CS()
    pošli_token(následník)
  elif mám_token and nechci_do_CS:
    pošli_token(následník)
  else:
    čekej_na_token()
```

**Raymond's Tree Algorithm:**
- Používá strom pro směrování žádostí
- Snižuje latenci na O(log N)

### 2. [Total Order Multicast](/notes/skupinova-komunikace-broadcast.html)

**Token-based Sequencing:**
- Token nese **sekvenční číslo**
- Pouze držitel tokenu smí broadcastovat
- Automaticky garantuje pořadí

```
if mám_token:
  msg.sequence = token.next_seq++
  broadcast(msg)
  pošli_token(další)
```

### 3. [Leader Election](/notes/volba-koordinatora-leader-election.html)
- Token označuje **aktuálního leadera**
- Pokud leader spadne, token se regeneruje a nový držitel = nový leader
- Jednoduchá volba bez hlasování

---

## Problémy a řešení
### Problém 1: Ztráta tokenu
**Detekce:**
- Timeout: Pokud token dlouho nepřišel
- Heartbeat: Token periodicky posílá "jsem živý"

**Regenerace:**
```
if timeout_uplynul():
  broadcast("Byl ztracen token?")
  if nikdo_neodpoví("Já ho mám"):
    vytvořit_nový_token()  # Riziko duplikace!
```

**Lepší řešení:** Logical timestamps
- Token má timestamp poslední aktualizace
- Při regeneraci: "Tvořím token s časem T"
- Pokud někdo má novější → použij ten

### Problém 2: Pád držitele tokenu
**Ring-based:**
- Detekuj pomocí heartbeat
- Vynech mrtvý uzel z kruhu
- Token regeneruj u následníka

**Tree-based:**
- Reorganizuj strom (odstraň mrtvý uzel)
- Žádosti přesměruj na rodiče

### Problém 3: Férové uspořádání

**Problém:** V token ring může být neférové (záleží na umístění v kruhu)

**Řešení:** Fronta žádostí
- Token obsahuje **frontu čekajících**
- Držitel předá token prvnímu ve frontě
- Nový žadatel se přidá na konec

---

## Srovnání s ostatními mechanismy

| Vlastnost | Token-based | [permission-based koordinace](/notes/permission-based-koordinace.html) | [quorum-based koordinace](/notes/quorum-based-koordinace.html) |
|-----------|-------------|-------------|--------|
| Počet zpráv | **O(1) - O(log N)** | O(N) | O(√N) - O(N/2) |
| Odolnost vůči výpadkům | ❌ Nízká | 🟡 Střední | ✅ Vysoká |
| Latence | 🟡 Závisí na pozici | ❌ Vysoká | 🟡 Střední |
| Složitost implementace | ✅ Nízká (ring) / 🟡 Střední (tree) | 🟡 Střední | ❌ Vysoká |
| Férové uspořádání | 🟡 Závisí na variantě | ✅ Ano (timestamp) | ✅ Ano (timestamp) |

---

## Kdy použít Token-based?

**Dobré pro:**
- Malé, stabilní systémy (N < 50)
- Nízká konkurence (procesy zřídka soutěží)
- Potřebuješ minimální počet zpráv
- Procesy jsou spolehlivé (nízké riziko pádu)

**Nepoužívej pro:**
- Velké systémy s častými výpadky
- Vysoká konkurence (všichni pořád čekají na token)
- Kritické aplikace bez možnosti centralizace
- Prostředí s nespolehlivou sítí

---

## Příklady z praxe

**1. Distributed Databases:**
- Oracle RAC používá token passing pro cache coherence
**2. Real-time Systems:**
- Token ring v průmyslových sítích (Profibus)
**3. Embedded Systems:**
- [CAN](/notes/can.html) bus používá token-like arbitraci