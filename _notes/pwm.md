---
related_course: NSWI028
title: "PWM"
---
PWM (Pulse Width Modulation) je technika generování signálu, kde se periodicky střídá HIGH a LOW stav. Poměr HIGH části k celé periodě se nazývá **duty cycle**.

# Duty Cycle
Duty cycle určuje, kolik procent jedné periody je signál v HIGH:
- **100%** — signál je stále HIGH
- **50%** — polovina periody HIGH, polovina LOW
- **0%** — signál je stále LOW

# Jak to funguje s timerem
Při použití hardwarového [timeru](/notes/timer-hardware.html):
1. Counter počítá od 0 do autoreload hodnoty — to je jedna perioda
2. Dokud counter < CCR (Capture/Compare Register), výstup je HIGH
3. Když counter >= CCR, výstup přejde na LOW
4. Counter se resetuje a cyklus se opakuje

Duty cycle se tedy mění zápisem do **CCR registru**: `duty cycle = CCR / autoreload`.

# Využití
- **Dimming LED** — PWM frekvence je tak vysoká (stovky Hz+), že lidské oko nevnímá blikání, ale vnímá nižší průměrný jas
- **Řízení motorů** — regulace rychlosti
- **Audio** — generování tónů
- **Komunikace** — některé protokoly využívají PWM

# Rozlišení
Rozlišení duty cycle závisí na hodnotě autoreload:
- Autoreload = 255 → 256 kroků (8-bit PWM)
- Autoreload = 999 → 1000 kroků
- Autoreload = 65535 → 65536 kroků (16-bit PWM)

Čím vyšší rozlišení, tím jemnější kontrola, ale pro většinu aplikací (LED dimming) stačí 8-bit (256 kroků).