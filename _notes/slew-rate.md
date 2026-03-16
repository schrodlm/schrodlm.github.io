---
layout: note
title: "slew rate"
---

Slew rate je rychlost, jakou se napětí na výstupu mění mezi LOW a HIGH (strmostí hrany).

- **Nízký slew rate** — pomalejší přechody, méně elektromagnetického rušení (EMI), nižší spotřeba
- **Vysoký slew rate** — rychlejší přechody, potřebný pro vysokorychlostní protokoly (např. SPI na desítkách MHz)

Pro pomalé operace (ovládání LED) stačí nízký slew rate. Vysoký je nutný tam, kde signálové hrany musí být dostatečně ostré pro splnění časových požadavků komunikačního protokolu.