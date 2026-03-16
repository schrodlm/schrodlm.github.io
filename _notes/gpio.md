---
layout: note
title: "GPIO"
---

GPIO (General Purpose Input/Output) je hardwarové rozhraní na mikrokontroléru, které poskytuje softwarově ovladatelné piny.

# GPIO Port
GPIO port je skupina pinů (typicky 16), které sdílejí jednu sadu řídicích registrů. Například GPIOA je port A obsahující piny PA0–PA15. Každý pin v rámci portu se konfiguruje **nezávisle** — port je jen organizační jednotka pro adresování.

Praktický benefit seskupení pinů do portů je možnost **atomických operací** — můžeš nastavit nebo přečíst více pinů na stejném portu jedním zápisem/čtením registru.

# Režimy pinu
Každý GPIO pin může pracovat v jednom z několika režimů:
- **Input** — čte externí signál (např. tlačítko)
- **Output** — řídí signál (např. LED)
- **Alternate Function** — pin je ovládán hardwarovou periferií (např. timer, SPI, I2C, UART) místo softwaru
- **Analog** — pro ADC/DAC

Dostupné alternate funkce pro každý pin jsou nadrátované v křemíku — nelze libovolně přiřadit jakoukoli periferii na jakýkoli pin. Toto mapování se najde v datasheetu čipu (tabulka alternate function mapping).

# Typy výstupu
Když je pin nakonfigurovaný jako výstup, existují dva režimy buzení:

## Push-Pull
Dva tranzistory aktivně řídí pin do HIGH i LOW:
- Horní tranzistor (P-MOS) připojí pin k VDD → "tlačí" (push) nahoru
- Spodní tranzistor (N-MOS) připojí pin k GND → "tahá" (pull) dolů

Pin má vždy definovanou úroveň. Nejběžnější režim pro řízení LED, signálů atd.

## Open-Drain
Pouze spodní tranzistor je použit:
- Může aktivně stáhnout do LOW
- Pro HIGH se tranzistor odpojí a **externí pull-up rezistor** vytáhne linku nahoru

Používá se pro sdílené sběrnice jako I2C, kde více zařízení sdílí jeden vodič — zabrání zkratu když dvě zařízení řídí linku současně.

# Pull rezistory
Interní pull-up nebo pull-down rezistory definují výchozí stav **vstupního** pinu, když ho nic aktivně neřídí:
- **Pull-up** — pin defaultně v HIGH
- **Pull-down** — pin defaultně v LOW
- **No-pull** — pin "plave" (nedefinovaný když není řízen)

U výstupních pinů v push-pull režimu jsou pull rezistory zbytečné, protože tranzistory aktivně definují úroveň.

# Zamknutí pinu
Některé mikrokontroléry umožňují zamknout konfiguraci pinu tak, že ji nelze změnit softwarem až do dalšího hardwarového resetu. Bezpečnostní mechanismus proti náhodnému překonfigurování kritických pinů.