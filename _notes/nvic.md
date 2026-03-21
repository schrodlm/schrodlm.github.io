---
related_course: NSWI028
title: "NVIC"
---
NVIC (Nested Vectored Interrupt Controller) je hardwarový obvod, který je součástí jádra procesoru (např. ARM Cortex-M). Řídí celý systém [přerušení](/notes/interrupt.html).

# Funkce NVIC
- **Povolení/zakázání** jednotlivých interruptů — pokud interrupt není v NVIC povolen, požadavek se zahodí
- **Priority** — každý interrupt má prioritu. Při současném příchodu více interruptů se obslouží ten s vyšší prioritou první
- **Vnořování (nesting)** — pokud během běžícího handleru přijde interrupt s vyšší prioritou, NVIC přeruší i ten handler
- **Vector table lookup** — v paměti je tabulka adres (vector table), kde ke každému interruptu je přiřazená adresa handler funkce. NVIC vyhledá správný handler a přesměruje na něj procesor.

# Řetězec zpracování interruptu
Například pro tlačítko připojené přes [GPIO](/notes/gpio.html) a [EXTI](/notes/exti.html):

1. **GPIO pin** — detekuje změnu signálu
2. **EXTI** — detekuje hranu (rising/falling) a generuje interrupt požadavek
3. **NVIC** — zkontroluje zda je interrupt povolen, vyhodnotí prioritu
4. **Procesor** — skočí do příslušného handleru z vector table
