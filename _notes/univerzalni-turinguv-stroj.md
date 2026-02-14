---
layout: note
title: "Univerzalni Turinguv Stroj"
---

Univerzální Turingův stroj je základní výpočetní model pro práci se složitostí a vyčíslitelností.

# Definice
Typicky se definuje jako pětice tvaru:
$$ TS = (Q, \Sigma, \delta, q_0, F)$$ 

$Q$ - množina stavů
$\Sigma$ - abeceda
$\delta$ - přechodová funkce, $\delta := (\Sigma, M) \to M$
$q_0$ - počáteční stav
$F$ - koncové stavy
---

## Struktura Turingova stroje
TS se skládá z řídící jednotky, obousměrné nekonečné pásky a hlavy pro čtení a zápis, která se může na pásce pohybovat oběma směry.

![Image](/assets/img/Pasted image 20260121154850.png)

### Displej
TS se rozhoduje na další instrukce podle dvojice stavu $(q,a); q\in Q, a\in \Sigma$. Této dvojici říkáme displej. Displej popisuje vstup do tabulky přechodové funkce. 

### Konfigurace
Aktuální informace o stavu výpočtu TS. Skládá se z řídící jednotky, slova na pásce a pozice hlavy na pásce.

---
## Výpočet
TS se rozhoduje na další instrukce podle dvojice stavu $(q,a); q\in Q, a\in \Sigma$. Této dvojici říkáme displej. Displej popisuje vstup do tabulky přechodové funkce. 


## Ukončení výpočtu TS
