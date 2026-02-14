---
tags:
  - distributed_system
language: czech
source: https://www.youtube.com/watch?v=A8oamrHf_cQ
title: "uspořádání (komunikace v distribuovaných systémech)"
---
Uspořádání zpráv je jedna z garancí definovaných [komunikačním modelem](/notes/komunikacni-model.html) distribuovaného systému, která určuje, v jakém pořadí jsou zprávy doručovány aplikacím.

---
## Typy uspořádání
Musíš vědět, jaké garance pořadí systém nabízí:
### FIFO uspořádání
- Garance: Zprávy od **jednoho konkrétního odesílatele** dorazí ve správném pořadí.
- _Příklad:_ Když já pošlu "$A$" a pak "$B$", všichni dostanou "$A$" a pak "$B$". Ale mezi to se může vklínit zpráva od někoho jiného.
![Image](/assets/img/Pasted image 20260118193052.png)
### Kauzální uspořádání (causal ordering)
Je to garance [doručovacího protokolu](/notes/dorucovaci-protokoly-delivery-protocols.html), která zajišťuje, že **fyzické doručení zpráv respektuje jejich [kauzální závislost](/notes/kauzalni-zavislost.html).**
![Image](/assets/img/Pasted image 20260118193339.png)

#### 1. Vztah ke kauzální závislosti
Zatímco **kauzální závislost** (A→B) je teoretický vztah mezi dvěma událostmi (happened-before relate), **kauzální uspořádání** je praktický mechanismus, který tento vztah vynucuje v síti.

**Formální definice:** Pokud odeslání zprávy $m_1​$ kauzálně předchází odeslání zprávy $m_2$​ (`Send(m1​)→Send(m2)`), pak systém garantuje, že každý uzel, který přijme obě zprávy, **musí doručit $m_1$​ aplikaci předtím, než doručí $m_2$​**.
#### 2. Rozdíl oproti FIFO
- **FIFO:** Řeší pouze pořadí od **jednoho** odesílatele ($m_1$​ a $m_2$​ jsou od procesu P).
- **Kauzální:** Řeší pořadí napříč **celým systémem** (řetězec závislostí může jít přes více uzlů: $P_1$​ pošle $m_1​$ → $P_2$​ přijme a pošle $m_2​$).
#### 3. Implementace (jak se to pozná?)
Protokol nemůže tušit obsah zpráv (neví, že $m_2$​ je odpověď na $m_1$​). Musí spoléhat na metadata.
- **Nástroj:** logický čas#Vektorové hodiny (vector clocks).
- **Princip:** Zpráva $m_2​$ si nese informaci (vektor): _"Jsem závislá na zprávě m1​ od procesu P1​."_
- **Vynucení:** Pokud přijde m2​ k příjemci dříve než m1​, příjemce vidí v jejím vektoru závislost, kterou nemá splněnou. Zpráva m2​ je **zadržena (Hold-back Queue)**, dokud po síti nedorazí opožděná m1​
#### 4. Výhoda (Proč to děláme?)
- Umožňuje **modely konzistence distribuovaného systému#Causal Consistency (Kauzální)**.
- Je efektivnější než totální uspořádání, protože **neblokuje** zprávy, které spolu nesouvisí (tzv. _souběžné zprávy_). Pokud $m_x​∣∣m_y​$ (nejsou na sobě závislé), mohou být doručeny v libovolném pořadí.
### Totální uspořádání (total ordering)
- Garance: **Všichni vidí všechno naprosto stejně.**
- Pokud server A vidí pořadí zpráv $M_1​,M_2​,M_3​$, pak server B, C i D musí vidět $M_1​,M_2​,M_3​$.
- _Použití:_ Nutné pro [state machine replication (SMR)](/notes/state-machine-replication-smr.html)** (aby měly všechny databáze na konci stejná data). Je to nejpomalejší a nejtěžší na implementaci.
![Image](/assets/img/Pasted image 20260118193714.png)

## Vztah mezi jednotlivými broadcast modely
![Image](/assets/img/Pasted image 20260118193937.png)