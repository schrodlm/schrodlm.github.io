---
tags:
  - distributed_system
language: czech
title: "virtuální synchronie"
---
Je to [komunikační model](/notes/komunikacni-model/) ,implementovaný [synchronizačními algoritmy](/notes/koordinace-a-synchronizace-v-distribuovanem-systemu/),zavedený systémem ISIS řeší problém, jak spolehlivě komunikovat ve skupině, kde se dynamicky mění členství (procesy padají a obnovují se).

Řeší otázku **"Co se stane, když uzel ve skupině umře?"**
- _Odpověď:_ Zajistí atomicitu a konzistenci při změně skupiny.
- _Stará se o:_ Aby se nestalo, že zprávu A dostane jen polovina skupiny, protože odesílatel zrovna spadl.
---
## Garance
>[!note] TL;DR
> "Virtuální synchronie garantuje, že všichni členové skupiny, kteří přežijí změnu pohledu, vidí **identickou historii zpráv** až do okamžiku této změny."

### Synchronizace pohledů (View Synchrony Property)

Toto je definující vlastnost.
> **Garance:** Pokud dva procesy ($p$ a $q$) přecházejí ze stejného pohledu $V_i​$ do stejného nového pohledu $V_i+1$​, musely v tom původním pohledu $V_i$​ doručit **naprosto shodnou množinu zpráv**.

- **Co to znamená:** Nestane se, že by proces $A$ dostal zprávu $M$ a proces $B$ ji nedostal, a přitom by oba pokračovali dál do nového pohledu.
- **Důsledek:** Repliky se nemohou rozejít. Buď mají obě zprávu, nebo ani jedna.
### 2. Atomicita (Failure Atomicity)
Řeší situaci, kdy odesílatel zprávy havaruje uprostřed odesílání (poslal to jen polovině skupiny).

> **Garance:** Zpráva poslaná v pohledu Vi​ je doručena buď **všem** nezhavarovaným procesům v tomto pohledu, nebo **nikomu**.

- **Princip "Všechno nebo nic":** Pokud odesílatel spadne, systém ([middleware](/notes/middleware/)) zprávu buď zahodí (pokud ji nemá nikdo živý), nebo ji přeživší procesy "dopošlou" ostatním (pokud ji alespoň jeden stihl přijmout).
### 3. Uspořádání vzhledem k pohledu 

Definuje bariéru.
> **Garance:** Žádná zpráva odeslaná v pohledu $V_i​$ nesmí být doručena v pohledu $V_i+1​$ (a naopak).

- **Bariéra:** Změna pohledu (View Change) funguje jako synchronizační bod. Všechny staré zprávy se musí flushnout předtím, než se inicializuje nový pohled.
### 4. Kauzalita a totální uspořádání (volitelné)
Virtuální synchronie sama o sobě garantuje jen "pořádek vůči pohledům". Uvnitř pohledu ale obvykle poskytuje garance uspořádání podle volby programátora:

- **Causal Order:** Respektuje logické hodiny.
- **Total Order:** Všichni vidí zprávy ve stejném pořadí (nutné pro active replication).
---
## Princip
Princip virtuální synchronie se dá shrnout do jediné věty: **"Zprávy a změny v členství skupiny (pády/připojení) jsou zpracovány ve stejném pořadí na všech uzlech."**

Jde o to vytvořit pro programátora **iluzi**, že se věci dějí v jasných, synchronizovaných krocích, ačkoliv pod kapotou běží nespolehlivá asynchronní síť.

Zde je ten princip rozepsaný do 3 kroků, které pochopíš:

### 1. Koncept "view"
Systém dělí čas na tzv. views.
- **Pohled** je prostě seznam aktuálně žijících členů skupiny.
- Např. `View_1 = {A, B, C, D}`.

### 2. Bariéra změny pohledu (View Change)
Když někdo spadne (např. D) nebo se připojí, systém musí přejít do `View_2 = {A, B, C}`. Virtuální synchronie zavádí **pravidlo bariéry**:

- Změna pohledu funguje jako tlustá čára v čase.
- Žádná zpráva odeslaná ve `View_1` nesmí "přeskočit" do `View_2`.
- Všechny zprávy z `View_1` musí být doručeny **všem**, kteří přežijí, **ještě předtím**, než se nainstaluje `View_2`.    

### 3. Princip "Doruč nebo zemři" (reliability)

To nejdůležitější se děje, když odesílatel spadne uprostřed práce.

**Scénář:**
1. Jsme ve `View_1 {A, B, C}`.
2. Uzel **A** pošle zprávu.
3. Uzel **B** ji přijme. Uzel **C** ji ještě nestihl přijmout.
4. Uzel **A** spadne (Crash).
    

**Reakce virtuální synchronie:**
1. Systém detekuje pád A. Zastaví doručování nových zpráv.
2. Zahájí tzv. **Flush protokol (Dočištění)**.
3. Uzel B zjistí, že má zprávu od A, kterou C nemá.
4. **B pošle tuto zprávu uzlu C.** (Přeživší si pomáhají).
5. Teprve až mají B i C stejné zprávy, systém vyhlásí `View_2 {B, C}`.
![Image](/assets/img/Pasted image 20260116180029.png)

---
## Analogie
Představ si skupinu lidí v místnosti, kteří si dělají poznámky (replikují data).
- **[Doručovací algoritmus](/notes/dorucovaci-protokoly-delivery-protocols/) (Total Order):**
    - Zajistí, že když mluvčí řekne větu, všichni si ji zapíší na řádek 5. Nikdo si ji nezapíše na řádek 6.
        
- **Virtuální synchronie:**
    - Řeší situaci, kdy mluvčí dostane infarkt uprostřed věty.
        
    - **Bez VS:** Půlka lidí slyšela konec věty, půlka ne. Každý má v sešitě něco jiného. Chaos.
        
    - **S VS:** Ti, co slyšeli konec, ho rychle pošeptají těm, co ho neslyšeli. Teprve až to mají všichni zapsané, vynesou mluvčího z místnosti a zamknou dveře (Změna pohledu / View Change).