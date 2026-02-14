---
tags:
  - distributed_system
language: czech
title: "stavovost distribuovaného systému"
---
Stavovost (statefulness) jako vlastnost systémů a popisuje, **zda a jak si systém pamatuje předchozí interakce, události nebo data**, a jak tento „stav“ ovlivňuje jeho další chování.

---

V distribuovaných systémech je stav rozprostřen mezi více uzly. Abychom zajistili spolehlivost a výkon, tento stav často **[replikujeme](/notes/replikace/)** (vytváříme kopie).

Jakmile máme více kopií téhož stavu, narážíme na zásadní problém: **Udržení synchronizace**.

### Vlastnosti stavu
U distribuovaného stavu sledujeme primárně jeho **[konzistenci](/notes/konzistence-distribuovaneho-systemu/)**.

> **Konzistence** je vlastnost stavu, která určuje, nakolik jsou data v různých replikách shodná v daném čase.

---
## [vztah spolehlivosti a stavu distribuovaného systému](/notes/vztah-spolehlivosti-a-stavu-distribuovaneho-systemu/)