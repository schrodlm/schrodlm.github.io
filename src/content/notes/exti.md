---
related_course: NSWI028
title: "EXTI"
---
EXTI (External Interrupt/Event Controller) je periferie v mikrokontroléru, která sedí mezi [GPIO](/notes/gpio/) piny a [NVIC](/notes/nvic/). Sleduje změny na pinech a generuje z nich [interrupt](/notes/interrupt/) nebo event požadavky.

# Funkce
- Detekuje **náběžnou hranu** (rising — 0→1)
- Detekuje **sestupnou hranu** (falling — 1→0)
- Nebo obojí najednou

# Mapování na piny
Číslo EXTI linky odpovídá číslu pinu — EXTI0 sleduje pin 0 na jakémkoli portu (PA0, PB0, PC0...), ale vždy jen **jeden z nich** najednou.
