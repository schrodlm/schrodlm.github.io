---
layout: note
title: "virtualizace"
---

**Virtualizace** je proces abstrakce výpočetních zdrojů, který umožňuje vytvořit softwarovou (virtuální) reprezentaci něčeho, co tradičně existuje ve fyzické podobě.

Nejčastěji se tento pojem používá ve smyslu **serverové virtualizace**, což je technika, která umožňuje na jednom fyzickém stroji provozovat více izolovaných operačních systémů současně.

### Základní principy

Virtualizace vkládá abstrakční vrstvu mezi fyzický hardware a operační systém/aplikace. Tato vrstva zajišťuje, že virtuální stroje "vidí" vlastní sadu hardwarových prostředků (CPU, RAM, disk), ačkoliv jsou tyto prostředky ve skutečnosti sdíleny.

Pro pochopení definice je nutné znát tři klíčové entity:
- **Host (Hostitel):** Fyzický hardware, na kterém virtualizace probíhá.
- **Hypervizor (VMM - Virtual Machine Monitor):** Software nebo firmware, který vytváří a spravuje virtuální stroje a přiděluje jim fyzické zdroje.
- **Guest (Host):** Samotný virtuální stroj (VM) s vlastním operačním systémem, který běží na hostiteli.