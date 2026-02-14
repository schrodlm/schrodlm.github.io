---
layout: note
title: "potential method"
---

**Využití:** Slouží k [amortizované analýze](/notes/amortized-analysis.html) algoritmů (určení průměrné složitosti operace v nejhorším případě pro posloupnost operací).

### Hlavní myšlenka (Globální pohled)

Na rozdíl od bankéřovy metody, kde ukládáme kredity k jednotlivým prvkům, zde přiřazujeme jedno číslo (**potenciál $\Phi$**) celému stavu datové struktury.

- **Stav struktury = Potenciální energie.**
- Prováděním operací se tento stav mění (energie roste nebo klesá).
- **Levné operace:** Mírně navýší potenciál (nabíjejí baterii/natahují pružinu).
- **Drahé operace:** Spotřebují nastřádaný potenciál, aby zaplatily svou vysokou reálnou cenu (vybíjejí baterii/uvolňují pružinu).