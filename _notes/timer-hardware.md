---
layout: note
title: "timer (hardware)"
---

Hardwarový timer je periferie v mikrokontroléru, která odlehčuje CPU od časově kritických a repetitivních úloh (jako je generování [PWM](/notes/pwm.html) signálu, měření časových intervalů atd.).

# Základní registry
Timer se skládá z několika klíčových registrů:
- **Counter register** — počítadlo, které se inkrementuje/dekrementuje s každým tiknutím
- **Prescaler register** — dělí vstupní clock. Pokud timer dostává 84 MHz a prescaler je 84, counter se inkrementuje s frekvencí 1 MHz
- **Autoreload register** — definuje periodu counteru. Když counter dosáhne této hodnoty, resetuje se na 0 a začne znovu
- **Capture/Compare register (CCR)** — používá se pro porovnání s counterem, klíčový pro [PWM](/notes/pwm.html) generování

# Kanály
Timer může mít více nezávislých kanálů (typicky 4). Každý kanál má vlastní CCR, takže může generovat nezávislý výstup. Kanály sdílejí prescaler, autoreload a counter (tedy frekvenci), ale duty cycle je pro každý kanál nezávislý.

# Režimy
- **Output** — timer generuje signál ven na pin (např. [PWM](/notes/pwm.html))
- **Input Capture** — timer měří příchozí signál (např. délku pulzu)

# Frekvence timeru
Vstupní clock timeru závisí na tom, na jaké sběrnici timer sedí (např. APB1, APB2). Timer clock se pak dělí prescalerem a autoreload hodnotou.

## Vzorce
**Timer clock** (frekvence tikání counteru):
$$f_{timer} = \frac{f_{vstup}}{prescaler + 1}$$

Prescaler se přičítá 1, protože hodnota 0 = dělení jedničkou (žádné dělení).

**Frekvence periody** (jak často counter přeteče / jak často se celý cyklus opakuje):
$$f_{perioda} = \frac{f_{timer}}{ARR + 1} = \frac{f_{vstup}}{(prescaler + 1) \times (ARR + 1)}$$

ARR (Autoreload) se taky přičítá 1, protože counter počítá od 0 — tedy ARR = 255 znamená 256 kroků (0–255).

## Příklad
- Vstupní clock = 84 MHz
- Prescaler = 9 → $f_{timer}$ = 84 MHz / 10 = 8.4 MHz
- ARR = 255 → $f_{perioda}$ = 8.4 MHz / 256 = **32 812 Hz**

To znamená, že jedna celá perioda (např. [PWM](/notes/pwm.html) cyklus) trvá přibližně 30 µs.

# Důležité
V [PWM](/notes/pwm.html) módu timer **negeneruje interrupt** (pokud ho explicitně nepovolíš). Hardware sám přepíná pin HIGH/LOW podle CCR registru — CPU se o to nestará. To je celý smysl offloadingu na timer.

# Mapování na piny
Výstupy timeru jsou propojené s konkrétními [GPIO](/notes/gpio.html) piny přes alternate function. Toto mapování je nadrátované v křemíku a najdeš ho v datasheetu čipu.

# Přerušení timeru

## Update Event Flag (UIF)
Když counter přeteče (dosáhne ARR a resetuje se), hardware nastaví flag `TIM_FLAG_UPDATE` (bit UIF v registru TIM_SR). Pokud je povoleno update interrupt (`TIM_IT_UPDATE`), vyvolá se ISR. **Flag se musí manuálně vyčistit v ISR** — pokud to neuděláš, přerušení se vyvolá okamžitě znovu (nekonečná smyčka přerušení).

```c
__HAL_TIM_CLEAR_FLAG(&htim, TIM_FLAG_UPDATE);
```

## Sdílené IRQ vektory (STM32F4)
Na STM32F4 není dostatek IRQ linek pro každý timer zvlášť, takže některé timery **sdílejí IRQ vektor**. Název vektoru popisuje, které *eventy* kterých timerů sdílejí daný vektor:

| IRQ Handler                      | Zdroj 1                  | Zdroj 2     |
| -------------------------------- | ------------------------ | ----------- |
| `TIM8_UP_TIM13_IRQHandler`       | TIM8 **update** event    | TIM13       |
| `TIM1_BRK_TIM9_IRQHandler`       | TIM1 **break** event     | TIM9        |
| `TIM1_UP_TIM10_IRQHandler`       | TIM1 **update** event    | TIM10       |
| `TIM1_TRG_COM_TIM11_IRQHandler`  | TIM1 **trigger/commut.** | TIM11       |

**UP = update event**, ne "counting up". Přerušení TIM1 jsou rozdělena podle typu eventu do více vektorů, a ke každému je připojen menší timer.

Pokud jsou oba timery na jednom vektoru aktivní, musíš v ISR zkontrolovat flagy obou:

```c
void TIM8_UP_TIM13_IRQHandler(void)
{
  if (__HAL_TIM_GET_FLAG(&htim8, TIM_FLAG_UPDATE)) {
    __HAL_TIM_CLEAR_FLAG(&htim8, TIM_FLAG_UPDATE);
    // handle TIM8
  }
  if (__HAL_TIM_GET_FLAG(&htim13, TIM_FLAG_UPDATE)) {
    __HAL_TIM_CLEAR_FLAG(&htim13, TIM_FLAG_UPDATE);
    // handle TIM13
  }
}
```

Pokud druhý timer nepoužíváš, stačí ošetřit jen ten svůj — ale kontrola flagu je dobrá praxe proti spurious interruptům.