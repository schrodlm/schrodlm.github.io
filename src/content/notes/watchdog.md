---
related_course: NSWI028
title: "Watchdog"
---
Watchdog je typicky HW counter, jehož účel je resetovat systém pokud dosáhne 0. Proto ho systém musí periodicky obnovovat. Tím dá systém najevo, že je zdravý a korektně funguje.

---
## STM watchdogs
STM32F4 ma dva typy watchdogu - kazdy slouzi k automatickemu resetu MCU pokud se firmware zasekne.
### IWDG (Independent Watchdog)
- Bezí na vlastnim **32 kHz LSI** oscilátoru — nezávislý na hlavních hodinách
- **Nelze zastavit** jakmile je jednou spuštěn
- **Nemá přerušení** — přímo resetuje MCU
- Dva konfigurovatelné parametry:
  - **Prescaler (PR\[2:0\])** — dělí 32 kHz clock (hodnoty /4 až /256)
  - **Reload value (RL\[11:0\])** — 12-bit down-counter (0x000 až 0xFFF)

**Vzorec pro timeout:**
```
timeout = (prescaler × (RL + 1)) / 32000   [sekundy]
```
**Tabulka timeoutů:**

| Prescaler | PR bity | Min timeout (RL=0x000) | Max timeout (RL=0xFFF) |
|-----------|---------|------------------------|------------------------|
| /4        | 0       | 0.125 ms               | 512 ms                 |
| /8        | 1       | 0.25 ms                | 1024 ms                |
| /16       | 2       | 0.5 ms                 | 2048 ms                |
| /32       | 3       | 1 ms                   | 4096 ms                |
| /64       | 4       | 2 ms                   | 8192 ms                |
| /128      | 5       | 4 ms                   | 16384 ms               |
| /256      | 6       | 8 ms                   | 32768 ms (~32.8s)      |

Příklad: timeout 1 sekundu → prescaler /32 (PR=3), RL=999 (0x3E7): `(32 × 1000) / 32000 = 1.0s`
> RL nemusí být mocnina 2 — hardware je prostý down-counter, na hodnotě nezáleží.

**HAL API:**
```c
IWDG_HandleTypeDef hiwdg;
hiwdg.Instance = IWDG;
hiwdg.Init.Prescaler = IWDG_PRESCALER_32;
hiwdg.Init.Reload = 999;
HAL_IWDG_Init(&hiwdg);

// Pravidelně volat před vypršením timeoutu:
HAL_IWDG_Refresh(&hiwdg);
```

### WWDG (Window Watchdog)

- Běží na APB1 clocku (závislý na systémových hodinách)
- **Má přerušení** (`WWDG_IRQn`) — early warning interrupt před resetem
- Refresh musí proběhnout v definovaném **okně** (ne příliš brzy, ne příliš pozdě)
- Vhodný pokud chcete před resetem uložit stav

## Priority přerušení (NVIC)

- **Nižší číslo = vyšší priorita** (0 je nejvyšší)
- STM32F4 má 4 bity pro prioritu (0–15)
- Vyšší priorita **může přerušit** (preempt) nižší prioritu
- Stejná priorita — nelze se vzájemně přerušit

```c
HAL_NVIC_SetPriority(EXTI0_IRQn, 2, 0);   // preempt priorita 2
HAL_NVIC_SetPriority(USART2_IRQn, 1, 0);   // preempt priorita 1 (vyšší)
```

Dva parametry priority:
- **Preempt priority** — rozhoduje o preempci mezi přerušeními
- **Sub-priority** — tiebreaker při stejné preempt prioritě (kdo jde první z fronty)

## Zkušenosti

Pracoval jsem s watchdogem 

### IWDG refresh v SysTick handleru

Refresh IWDG jsem umístil do `SysTick_Handler` (volá se každou 1 ms). Tím je watchdog "nakopnut" každou milisekundu — při timeoutu 1s je to víc než dost. `HAL_IWDG_Refresh` je jen jeden zápis do registru, takže vysoká frekvence refreshe nevadí.

Aby šlo definovat `SysTick_Handler` v `main.c` (odevzdává se jeden soubor), v `stm32f4xx_it.c` se dá originální definice označit jako `__weak` — linker pak preferuje tu bez `__weak`.

### Testování watchdogu

Při testování IWDG (nekonečná smyčka v EXTI callbacku) to vypadalo, že watchdog nefunguje — MCU se resetovalo, ale program naběhl do stejného stavu a nebylo to vidět.

Řešení: přidat na začátek `main()` viditelnou signalizaci (rozsvítit všechny LED na 1s), aby byl reset vizuálně rozpoznatelný.

### LED abstrakce

Pro práci s LED diodami přes PWM (TIM4) se osvědčila tabulka mapující pin → timer channel:

```c
typedef struct {
  uint32_t pin;
  uint32_t channel;
} LedConfig;

LedConfig led_channel_mapping[LED_CNT] = {
  {LED_GREEN,  TIM_CHANNEL_1},
  {LED_ORANGE, TIM_CHANNEL_2},
  {LED_RED,    TIM_CHANNEL_3},
  {LED_BLUE,   TIM_CHANNEL_4},
};
```

LED definice (`LED_GREEN = LD4_Pin` atd.) jsou bitové masky GPIO pinů — díky tomu funguje bitový OR pro ovládání více LED najednou: `led_set(LED_GREEN | LED_RED, 255)`.

Funkce iterují přes tabulku a testují bitmask:

```c
void led_set(uint16_t leds, uint8_t duty_cycle) {
  for (int i = 0; i < LED_CNT; i++) {
    if (led_channel_mapping[i].pin & leds)
      __HAL_TIM_SET_COMPARE(&htim4, led_channel_mapping[i].channel, duty_cycle);
  }
}
```