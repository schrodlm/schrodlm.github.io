---
layout: note
title: "interrupt"
---

Interrupt (přerušení) je mechanismus, kterým hardware nebo software asynchronně upozorní procesor, že nastala událost vyžadující pozornost.

Když přijde interrupt, procesor přeruší aktuální provádění, uloží kontext (registry, program counter) a skočí do **interrupt handleru** — funkce, která událost obslouží. Po dokončení se vrátí k původnímu kódu.

# Interrupt vs. Polling
Dva přístupy ke zjišťování událostí:

- **Polling** — procesor se v smyčce opakovaně ptá "stalo se něco?". Jednodušší na pochopení, ale plýtvá cykly CPU.
- **Interrupt** — hardware sám oznámí procesoru, že se něco stalo. Efektivnější — procesor dělá jinou práci a reaguje jen když je potřeba.

# Interrupt vs. Event
- **Interrupt** — vyvolá skok do handleru (přeruší aktuální kód)
- **Event** — jen nastaví příznak, který lze pollingem kontrolovat, nebo probudí procesor z low-power režimu. Nevyvolá handler.

# NVIC
Viz [NVIC](/notes/nvic.html).

# Edge Detection
Interrupt může být nakonfigurován na detekci:
- **Rising edge** — přechod signálu z LOW do HIGH (0→1)
- **Falling edge** — přechod z HIGH do LOW (1→0)
- **Both edges** — obojí

# Debouncing
Mechanické spínače (tlačítka) při stisku generují rychlé zákmity (bouncing) — signál několikrát poskočí mezi 0 a 1 během pár milisekund. Řeší se dvěma mechanismy:
- **Časový debounce** — ignoruj události po dobu N ms po posledním stisku
- **Edge detection** — reaguj jen na přechod (náběžnou hranu), ne na stav. Kombinace obou přístupů je nejspolehlivější.