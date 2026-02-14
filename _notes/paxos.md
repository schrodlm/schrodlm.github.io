---
tags: [distributed_system]
source: https://www.youtube.com/watch?v=d7nAGI_NZPk
language: czech
title: "paxos"
---
Je to základní **rodina protokolů** pro [dosažení konsenzu](/notes/konsenzus-v-distribuovanych-systemech/) využívající [quorum-based koordinace](/notes/quorum-based-koordinace/) v asynchronním systému, kde uzly mohou havarovat, ale nejsou zákeřné (nevyskytují se byzantine failures). Leslie Lamport ho navrhl tak, aby byl matematicky neprůstřelný i v nespolehlivých sítích.

## Co Paxos řeší (Pochopení "Proč?")

Hlavním cílem je vytvořit **[replicated state machine](/notes/state-machine-replication-smr/)**.

Cílem je tedy dosažení **jediného** konsenzu. Jakmile je konsenzus dosažen, nemůžeme dostat další konsenzus. Musíme celý paxos algoritmus pustit znovu. (Takt to funguje v základním "vanilla" algortimu).

**Problém:** Máte 5 serverů a chcete, aby se chovaly jako jeden nezničitelný počítač. Pokud klient pošle příkaz "přičti 10", musí ho všechny servery zapsat do svého logu ve stejném pořadí .

**Výsledek:** I když 2 servery ze 5 shoří, zbylé 3 se shodnou na dalším kroku a systém běží dál bez ztráty dat. Klient má pocit, že mluví s jedním spolehlivým automatem.

---

## Co předpokládá o systému?
Paxos má velmi realistické (pesimistické) předpoklady o prostředí:

**Nespolehlivá síť:** Zprávy se mohou zpozdit, ztratit, duplikovat nebo dorazit v jiném pořadí.

**Nespolehlivé uzly:** Servery mohou kdykoliv spadnout a po libovolné době se zase "probudit".

**Stabilní úložiště:** Klíčový požadavek! Uzly musí mít persistentní paměť, aby si i po restartu pamatovaly své předchozí sliby a hlasy.

**Většinové kvórum:** Pro funkčnost vyžaduje aspoň $2F+1$ uzlů, aby přežil výpadek $F$ z nich (většina musí vždy žít).

---
## Koncepty (hodně zjednodušeně)

### Role v protokolu Paxos

Jeden fyzický uzel v síti může (a typicky také v praxi zastává) několik těchto rolí současně:

**Client**: Uživatel nebo aplikace, která posílá požadavek na změnu stavu (např. „zapiš data“).

**Proposer**: Navrhovatel. Přijímá požadavky od klientů a snaží se pro ně získat souhlas od Acceptorů. Jeden Proposer je obvykle zvolen jako **Leader** (hlavní navrhovatel).

**Acceptor**: Schvalovatel (volič). Tyto uzly tvoří tzv. **Quorum** (většinu). Jejich úkolem je hlasovat o návrzích a pamatovat si výsledek.

**Learner**: Učedník. Tyto uzly nehlasují, ale pouze čekají na zprávu, že se většina Acceptorů na něčem shodla, a následně tuto hodnotu aplikují (provedou příkaz).

## Pomocné koncepty (Důležité pro pochopení)

**Ballot number (Hlasovací číslo)**: Každý návrh musí mít unikátní a rostoucí číslo ve formátu `[číslo, ID_procesu]`. Slouží k tomu, aby se uzly nenechaly zmást starými zprávami, které se v nespolehlivé síti zpozdily.

**Quorum**: Libovolná většinová podmnožina Acceptorů. Zpráva je považována za platnou až poté, co ji potvrdí celé Quorum.

---
## Algoritmus
### Fáze 1: Příprava a Slib (Prepare & Promise)
1. **Proposer** zvolí nové `Ballot` číslo a pošle zprávu `Prepare(Ballot)` všem Acceptorům.
2. **Acceptor** zprávu přijme. Pokud je toto číslo vyšší než jakékoliv, které viděl dříve, odpoví zprávou **Promise**:
	- Slibuje, že už nikdy neakceptuje žádný návrh s nižším číslem.
	- Pokud už v minulosti nějaký návrh schválil, pošle Proposerovi jeho hodnotu a číslo (`AcceptBallot`, `AcceptValue`).

### Fáze 2: Akceptace 
Jakmile Proposer získá sliby od většiny (Quora), přejde k samotnému hlasování.
1. **Proposer** musí vybrat hodnotu, kterou pošle:
	- Pokud mu některý Acceptor v první fázi poslal již dříve schválenou hodnotu, Proposer **musí** použít tuto hodnotu (respektuje historii).
	- Pokud jsou všechny odpovědi „čisté“, může navrhnout svou vlastní hodnotu od klienta.
2. Proposer pošle zprávu **Accept(Ballot, Hodnota)**.
3. **Acceptor** zprávu přijme. Pokud mezi fází 1 a 2 nepřijal jiný návrh s ještě vyšším číslem, zapíše si hodnotu do stabilního úložiště a pošle zprávu **Accepted** všem Proposerům a Learnerům.
4. **Learner** (a původní Proposer) po obdržení potvrzení od většiny Acceptorů ví, že hodnota byla definitivně zvolena.

![Image](/assets/img/Pasted image 20260118164800.png)

### Shrnutí
Tyto dvě fáze zajišťují, že i když uzel uprostřed procesu vypadne nebo se síť rozdělí, systém se nikdy neshodne na dvou různých věcech. První fáze **uklízí po starých lídrech** a druhá fáze **potvrzuje novou pravdu**. Klíčem je **zápis do stabilního úložiště** (nesmazatelný inkoust), aby uzly po restartu věděly, co slíbily.

---
## Co je výsledkem?
Výsledkem jednoho běhu Paxosu je **jedna nezměnitelná hodnota**, na které se shodla většina systému.

- V praxi (tzv. **Multi-Paxos**) se tento proces neustále opakuje.
- Každé opakování (instance) zaplní jeden "slot" v logu příkazů.
- Finálním výsledkem je tedy **konzistentní, seřazený seznam operací**, který mají všechny repliky stejný.